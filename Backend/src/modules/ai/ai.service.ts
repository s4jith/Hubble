import { env } from '../../config/env';
import { AbuseCategory } from '../../config/constants';
import { logger } from '../../utils/logger';
import { ExternalServiceError } from '../../utils/errors';
import { keywordClassifier, KeywordClassificationResult } from './keyword-classifier';
import GeminiClient, { GeminiAnalysisResult } from './gemini-client';

/**
 * AI Analysis Result Interface
 */
export interface AIAnalysisResult {
  isAbusive: boolean;
  categories: AbuseCategory[];
  severityScore: number;
  confidence: number;
  sentiment: string;
  threatDetected: boolean;
  keywordMatch?: KeywordClassificationResult;
  geminiAnalysis?: GeminiAnalysisResult;
  analysisMethod: 'keyword-only' | 'keyword-gemini' | 'gemini-only' | 'mock';
  rawResponse?: Record<string, unknown>;
}

/**
 * AI Service
 * Handles communication with external AI/NLP service for content analysis
 * Uses multi-stage analysis: Keyword Classification -> Gemini AI -> Mock (fallback)
 * 
 * ARCHITECTURE NOTE:
 * This service is decoupled from the main application logic.
 * It can be easily swapped with different AI providers or internal microservices.
 */
export class AIService {
  private readonly serviceUrl: string;
  private readonly apiKey: string;
  private readonly mockEnabled: boolean;
  private geminiClient: GeminiClient | null;

  constructor() {
    this.serviceUrl = env.ai.serviceUrl;
    this.apiKey = env.ai.apiKey;
    this.mockEnabled = env.ai.mockEnabled;
    
    // Initialize Gemini client if API keys are provided
    if (env.ai.geminiApiKeys && env.ai.geminiApiKeys.length > 0 && !this.mockEnabled) {
      this.geminiClient = new GeminiClient(env.ai.geminiApiKeys);
      logger.info('Gemini AI client initialized');
    } else {
      this.geminiClient = null;
      logger.info('Gemini AI disabled - using keyword classification or mock');
    }
  }

  /**
   * Analyze text content for cyberbullying
   * Multi-stage process:
   * 1. Keyword classification (fast pre-screening)
   * 2. Gemini AI (if needed for context/ambiguity)
   * 3. Mock analysis (fallback for dev/demo)
   */
  async analyzeText(content: string): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    logger.info('AI analysis started', { contentLength: content.length });

    try {
      // Stage 1: Keyword Classification (always run - it's fast)
      const keywordResult = keywordClassifier.classify(content);
      
      logger.info('Keyword classification complete', {
        isAbusive: keywordResult.isAbusive,
        categories: keywordResult.detectedCategories.length,
        needsAdvanced: keywordResult.needsAdvancedAnalysis
      });

      // If clear safe content or mock mode, return keyword result
      if (!keywordResult.isAbusive && !keywordResult.needsAdvancedAnalysis) {
        const processingTime = Date.now() - startTime;
        logger.info('Analysis complete (keyword-only)', { processingTime });
        
        return {
          isAbusive: false,
          categories: [],
          severityScore: 0,
          confidence: keywordResult.confidence,
          sentiment: 'neutral',
          threatDetected: false,
          keywordMatch: keywordResult,
          analysisMethod: 'keyword-only',
          rawResponse: { keywords: keywordResult }
        };
      }

      // Stage 2: Gemini AI Analysis (for ambiguous or harmful content)
      if (this.geminiClient && !this.mockEnabled) {
        try {
          const geminiResult = await this.geminiClient.analyzeText(content);
          
          // Combine keyword and Gemini results
          const combinedResult = this.combineTextResults(keywordResult, geminiResult);
          
          const processingTime = Date.now() - startTime;
          logger.info('Analysis complete (keyword + Gemini)', { 
            processingTime,
            isAbusive: combinedResult.isAbusive 
          });
          
          return {
            ...combinedResult,
            keywordMatch: keywordResult,
            geminiAnalysis: geminiResult,
            analysisMethod: 'keyword-gemini'
          };
        } catch (error) {
          logger.error('Gemini AI failed, falling back to keyword result', error);
          // Fall through to use keyword result
        }
      }

      // Stage 3: Use keyword result or mock
      if (this.mockEnabled) {
        const mockResult = await this.getMockAnalysis(content);
        const processingTime = Date.now() - startTime;
        logger.info('Analysis complete (mock)', { processingTime });
        return mockResult;
      }

      // Return enhanced keyword result
      const processingTime = Date.now() - startTime;
      logger.info('Analysis complete (keyword-enhanced)', { processingTime });
      
      return {
        isAbusive: keywordResult.isAbusive,
        categories: keywordResult.detectedCategories,
        severityScore: keywordResult.severityScore,
        confidence: keywordResult.confidence,
        sentiment: this.detectSentiment(content, keywordResult.isAbusive),
        threatDetected: keywordResult.detectedCategories.some(c => 
          c === AbuseCategory.THREAT || c === AbuseCategory.SELF_HARM
        ),
        keywordMatch: keywordResult,
        analysisMethod: 'keyword-only',
        rawResponse: { keywords: keywordResult }
      };
    } catch (error) {
      logger.error('AI analysis failed', error);
      throw new ExternalServiceError('AI Analysis');
    }
  }

  /**
   * Analyze image content for harmful content
   */
  async analyzeImage(imageUrlOrData: string): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    logger.info('AI image analysis started');

    try {
      // Use Gemini for image analysis
      if (this.geminiClient && !this.mockEnabled) {
        const geminiResult = await this.geminiClient.analyzeImage(imageUrlOrData);
        
        const processingTime = Date.now() - startTime;
        logger.info('Image analysis complete (Gemini)', { 
          processingTime,
          isAbusive: geminiResult.isAbusive 
        });

        return {
          isAbusive: geminiResult.isAbusive,
          categories: geminiResult.categories,
          severityScore: geminiResult.severityScore,
          confidence: geminiResult.confidence,
          sentiment: geminiResult.sentiment,
          threatDetected: geminiResult.threatDetected,
          geminiAnalysis: geminiResult,
          analysisMethod: 'gemini-only',
          rawResponse: geminiResult.rawResponse
        };
      }

      // Fallback to mock for images
      const mockResult = await this.getMockImageAnalysis(imageUrlOrData);
      const processingTime = Date.now() - startTime;
      logger.info('Image analysis complete (mock)', { processingTime });
      
      return mockResult;
    } catch (error) {
      logger.error('AI image analysis failed', error);
      throw new ExternalServiceError('AI Image Analysis');
    }
  }

  /**
   * Combine keyword and Gemini results for better accuracy
   */
  private combineTextResults(
    keyword: KeywordClassificationResult,
    gemini: GeminiAnalysisResult
  ): AIAnalysisResult {
    // Trust Gemini more for final classification, but use keywords as validation
    const isAbusive = gemini.isAbusive || keyword.isAbusive;
    
    // Combine categories (union of both)
    const allCategories = [...new Set([
      ...keyword.detectedCategories,
      ...gemini.categories
    ])];

    // Take higher severity
    const severityScore = Math.max(keyword.severityScore, gemini.severityScore);

    // Average confidence (Gemini is more reliable)
    const confidence = (gemini.confidence * 0.7) + (keyword.confidence * 0.3);

    return {
      isAbusive,
      categories: allCategories,
      severityScore,
      confidence,
      sentiment: gemini.sentiment,
      threatDetected: gemini.threatDetected || keyword.detectedCategories.some(c =>
        c === AbuseCategory.THREAT || c === AbuseCategory.SELF_HARM
      ),
      analysisMethod: 'keyword-gemini' as const,
      rawResponse: {
        keyword: keyword,
        gemini: gemini.rawResponse
      }
    };
  }

  /**
   * Generate mock analysis for development/demo
   * This provides realistic responses based on content keywords
   */
  private async getMockAnalysis(content: string): Promise<AIAnalysisResult> {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

    const lowerContent = content.toLowerCase();
    
    // Detect various types of abusive content
    const detections = {
      harassment: this.detectHarassment(lowerContent),
      threat: this.detectThreats(lowerContent),
      hatespeech: this.detectHateSpeech(lowerContent),
      bullying: this.detectBullying(lowerContent),
      profanity: this.detectProfanity(lowerContent),
      selfharm: this.detectSelfHarm(lowerContent),
    };

    const categories: AbuseCategory[] = [];
    let severityScore = 0;
    let threatDetected = false;

    // Calculate severity and categories
    if (detections.threat.detected) {
      categories.push(AbuseCategory.THREAT);
      severityScore = Math.max(severityScore, detections.threat.severity);
      threatDetected = true;
    }
    if (detections.selfharm.detected) {
      categories.push(AbuseCategory.SELF_HARM);
      severityScore = Math.max(severityScore, detections.selfharm.severity);
      threatDetected = true;
    }
    if (detections.hatespeech.detected) {
      categories.push(AbuseCategory.HATE_SPEECH);
      severityScore = Math.max(severityScore, detections.hatespeech.severity);
    }
    if (detections.harassment.detected) {
      categories.push(AbuseCategory.HARASSMENT);
      severityScore = Math.max(severityScore, detections.harassment.severity);
    }
    if (detections.bullying.detected) {
      categories.push(AbuseCategory.BULLYING);
      severityScore = Math.max(severityScore, detections.bullying.severity);
    }
    if (detections.profanity.detected) {
      categories.push(AbuseCategory.PROFANITY);
      severityScore = Math.max(severityScore, detections.profanity.severity);
    }

    const isAbusive = categories.length > 0;
    const confidence = isAbusive ? 0.75 + Math.random() * 0.2 : 0.85 + Math.random() * 0.1;
    const sentiment = this.detectSentiment(lowerContent, isAbusive);

    return {
      isAbusive,
      categories,
      severityScore,
      confidence: Math.round(confidence * 100) / 100,
      sentiment,
      threatDetected,
      analysisMethod: 'mock' as const,
      rawResponse: { mock: true, detections },
    };
  }

  /**
   * Generate mock image analysis for development/demo
   */
  private async getMockImageAnalysis(imageUrlOrData: string): Promise<AIAnalysisResult> {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 300));

    // For mock purposes, analyze based on image URL/data string if it contains keywords
    const lowerContent = imageUrlOrData.toLowerCase();
    
    // Simulate random detection for demonstration
    const hasViolence = lowerContent.includes('violence') || lowerContent.includes('fight') || Math.random() > 0.7;
    const hasInappropriate = lowerContent.includes('inappropriate') || Math.random() > 0.8;
    
    const categories: AbuseCategory[] = [];
    let severityScore = 0;
    let threatDetected = false;

    if (hasViolence) {
      categories.push(AbuseCategory.THREAT);
      severityScore = 60 + Math.random() * 30;
      threatDetected = true;
    }
    
    if (hasInappropriate) {
      categories.push(AbuseCategory.HARASSMENT);
      severityScore = Math.max(severityScore, 40 + Math.random() * 25);
    }

    const isAbusive = categories.length > 0;
    const confidence = isAbusive ? 0.70 + Math.random() * 0.2 : 0.80 + Math.random() * 0.15;

    return {
      isAbusive,
      categories,
      severityScore,
      confidence: Math.round(confidence * 100) / 100,
      sentiment: isAbusive ? 'negative' : 'neutral',
      threatDetected,
      analysisMethod: 'mock' as const,
      rawResponse: { mock: true, imageAnalysis: true },
    };
  }

  private detectHarassment(content: string): { detected: boolean; severity: number } {
    const patterns = ['loser', 'ugly', 'stupid', 'idiot', 'dumb', 'worthless', 'nobody likes'];
    const detected = patterns.some((p) => content.includes(p));
    return { detected, severity: detected ? 40 + Math.random() * 20 : 0 };
  }

  private detectThreats(content: string): { detected: boolean; severity: number } {
    const patterns = ['kill', 'hurt', 'beat', 'attack', 'fight', 'punch', 'destroy'];
    const detected = patterns.some((p) => content.includes(p));
    return { detected, severity: detected ? 70 + Math.random() * 25 : 0 };
  }

  private detectHateSpeech(content: string): { detected: boolean; severity: number } {
    const patterns = ['hate', 'racist', 'discrimination'];
    const detected = patterns.some((p) => content.includes(p));
    return { detected, severity: detected ? 60 + Math.random() * 30 : 0 };
  }

  private detectBullying(content: string): { detected: boolean; severity: number } {
    const patterns = ['bully', 'pick on', 'make fun', 'laugh at', 'embarrass', 'humiliate'];
    const detected = patterns.some((p) => content.includes(p));
    return { detected, severity: detected ? 50 + Math.random() * 25 : 0 };
  }

  private detectProfanity(content: string): { detected: boolean; severity: number } {
    // Using mild detection for demo - in production, use proper profanity list
    const patterns = ['damn', 'hell', 'crap'];
    const detected = patterns.some((p) => content.includes(p));
    return { detected, severity: detected ? 20 + Math.random() * 15 : 0 };
  }

  private detectSelfHarm(content: string): { detected: boolean; severity: number } {
    const patterns = ['self harm', 'hurt myself', 'end it all', 'suicide', 'cut myself'];
    const detected = patterns.some((p) => content.includes(p));
    return { detected, severity: detected ? 90 + Math.random() * 10 : 0 };
  }

  private detectSentiment(content: string, isAbusive: boolean): string {
    if (isAbusive) {
      return 'negative';
    }
    
    const positivePatterns = ['happy', 'great', 'love', 'thanks', 'awesome', 'good'];
    const negativePatterns = ['sad', 'bad', 'angry', 'upset', 'worried'];
    
    const hasPositive = positivePatterns.some((p) => content.includes(p));
    const hasNegative = negativePatterns.some((p) => content.includes(p));

    if (hasPositive && !hasNegative) return 'positive';
    if (hasNegative && !hasPositive) return 'negative';
    if (hasPositive && hasNegative) return 'mixed';
    return 'neutral';
  }

  /**
   * Check AI service health
   */
  async checkHealth(): Promise<boolean> {
    if (this.mockEnabled) {
      return true;
    }

    try {
      const response = await fetch(`${this.serviceUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const aiService = new AIService();
export default aiService;
