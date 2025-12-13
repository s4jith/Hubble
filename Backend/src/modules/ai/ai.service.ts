import { env } from '../../config/env';
import { AbuseCategory } from '../../config/constants';
import { logger } from '../../utils/logger';
import { ExternalServiceError } from '../../utils/errors';

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
  rawResponse?: Record<string, unknown>;
}

/**
 * AI Service
 * Handles communication with external AI/NLP service for content analysis
 * Supports both real API calls and mock responses for demo/development
 * 
 * ARCHITECTURE NOTE:
 * This service is decoupled from the main application logic.
 * It can be easily swapped with different AI providers or internal microservices.
 */
export class AIService {
  private readonly serviceUrl: string;
  private readonly apiKey: string;
  private readonly mockEnabled: boolean;

  constructor() {
    this.serviceUrl = env.ai.serviceUrl;
    this.apiKey = env.ai.apiKey;
    this.mockEnabled = env.ai.mockEnabled;
  }

  /**
   * Analyze text content for cyberbullying
   */
  async analyzeText(content: string): Promise<AIAnalysisResult> {
    const startTime = Date.now();
    logger.info('AI analysis started', { contentLength: content.length });

    try {
      let result: AIAnalysisResult;

      if (this.mockEnabled) {
        result = await this.getMockAnalysis(content);
      } else {
        result = await this.callExternalService(content);
      }

      const processingTime = Date.now() - startTime;
      logger.info('AI analysis completed', { processingTime, isAbusive: result.isAbusive });

      return result;
    } catch (error) {
      logger.error('AI analysis failed', error);
      throw new ExternalServiceError('AI Analysis');
    }
  }

  /**
   * Call external AI service
   */
  private async callExternalService(content: string): Promise<AIAnalysisResult> {
    const response = await fetch(this.serviceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ text: content }),
    });

    if (!response.ok) {
      throw new Error(`AI service returned ${response.status}`);
    }

    const data = await response.json();

    // Map external response to our format
    return this.mapExternalResponse(data as Record<string, unknown>);
  }

  /**
   * Map external service response to our format
   * Adjust this based on actual AI service response structure
   */
  private mapExternalResponse(data: Record<string, unknown>): AIAnalysisResult {
    return {
      isAbusive: data.isAbusive as boolean ?? false,
      categories: (data.categories as AbuseCategory[]) ?? [],
      severityScore: (data.severityScore as number) ?? 0,
      confidence: (data.confidence as number) ?? 0,
      sentiment: (data.sentiment as string) ?? 'neutral',
      threatDetected: (data.threatDetected as boolean) ?? false,
      rawResponse: data,
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
      rawResponse: { mock: true, detections },
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
