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
  analysisMethod: 'ai-engine' | 'mock';
  rawResponse?: Record<string, unknown>;
}

/**
 * AI Service
 * Handles communication with the Hubble AI Engine (FastAPI)
 */
export class AIService {
  private readonly serviceUrl: string;
  private readonly apiKey: string;
  private readonly mockEnabled: boolean;

  constructor() {
    this.serviceUrl = env.ai.serviceUrl;
    this.apiKey = env.ai.apiKey;
    this.mockEnabled = env.ai.mockEnabled;
    
    logger.info('AI Service initialized', { 
      serviceUrl: this.serviceUrl, 
      mockEnabled: this.mockEnabled 
    });
  }

  /**
   * Analyze text content for cyberbullying via Hubble AI Engine
   */
  async analyzeText(content: string, userId?: string, sourceApp?: string): Promise<AIAnalysisResult> {
    if (this.mockEnabled) {
      return this.getMockAnalysis(content);
    }

    const startTime = Date.now();
    try {
      const response = await fetch(`${this.serviceUrl}/api/v1/analyze/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          text: content,
          user_id: userId,
          source_app: sourceApp,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI Engine error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;
      
      logger.info('AI text analysis complete', { processingTime, status: data.status });

      return this.mapResponse(data, 'ai-engine');
    } catch (error) {
      logger.error('AI text analysis failed', error);
      throw new ExternalServiceError('AI Analysis Service');
    }
  }

  /**
   * Analyze image content via Hubble AI Engine
   */
  async analyzeImage(imageData: string, userId?: string, sourceApp?: string): Promise<AIAnalysisResult> {
    if (this.mockEnabled) {
      return this.getMockImageAnalysis(imageData);
    }

    const startTime = Date.now();
    try {
      const formData = new FormData();
      
      // Handle base64 or URL
      if (imageData.startsWith('data:')) {
        const blob = await this.dataURIToBlob(imageData);
        formData.append('file', blob, 'image.jpg');
      } else {
        // AI engine expects a file, if we have a URL we'd need to fetch it first 
        // or the AI engine should support URL. For now, assume it's base64/blob.
        throw new Error('Image analysis requires base64/blob data');
      }

      if (userId) formData.append('user_id', userId);
      if (sourceApp) formData.append('source_app', sourceApp);

      const response = await fetch(`${this.serviceUrl}/api/v1/analyze/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          // Note: fetch automatically sets the multi-part boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI Engine error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;
      
      logger.info('AI image analysis complete', { processingTime, status: data.status });

      return this.mapResponse(data, 'ai-engine');
    } catch (error) {
      logger.error('AI image analysis failed', error);
      throw new ExternalServiceError('AI Image Analysis Service');
    }
  }

  /**
   * Maps FastAPI AnalysisResponse to Backend AIAnalysisResult
   */
  private mapResponse(data: any, method: 'ai-engine' | 'mock'): AIAnalysisResult {
    return {
      isAbusive: data.status === 'BLOCKED' || data.status === 'WARNING',
      categories: (data.categories || []).map((cat: string) => this.mapCategory(cat)),
      severityScore: data.risk_score || 0,
      confidence: data.confidence || 0,
      sentiment: data.decision?.reason || 'neutral', // Using reason as proxy for detailed sentiment if not present
      threatDetected: data.risk_level === 'HIGH' || data.categories?.includes('threat'),
      analysisMethod: method,
      rawResponse: data,
    };
  }

  /**
   * Map AI Engine categories to internal AbuseCategory enum
   */
  private mapCategory(cat: string): AbuseCategory {
    const map: Record<string, AbuseCategory> = {
      'toxic': AbuseCategory.HARASSMENT,
      'insult': AbuseCategory.HARASSMENT,
      'threat': AbuseCategory.THREAT,
      'identity_hate': AbuseCategory.HATE_SPEECH,
      'harassment': AbuseCategory.HARASSMENT,
      'bullying': AbuseCategory.BULLYING,
      'profanity': AbuseCategory.PROFANITY,
      'self_harm': AbuseCategory.SELF_HARM,
    };
    return map[cat.toLowerCase()] || AbuseCategory.HARASSMENT;
  }

  /**
   * Utility to convert Data URI to Blob
   */
  private async dataURIToBlob(dataURI: string): Promise<Blob> {
    const splitDataURI = dataURI.split(',');
    const byteString = atob(splitDataURI[1]);
    const mimeString = splitDataURI[0].split(':')[1].split(';')[0];
    const ia = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ia], { type: mimeString });
  }

  /**
   * Mock implementations for development
   */
  private async getMockAnalysis(content: string): Promise<AIAnalysisResult> {
    await new Promise(r => setTimeout(r, 100)); // Simulate delay
    const isAbusive = content.toLowerCase().includes('loser') || content.toLowerCase().includes('hate');
    return {
      isAbusive,
      categories: isAbusive ? [AbuseCategory.HARASSMENT] : [],
      severityScore: isAbusive ? 75 : 0,
      confidence: 0.95,
      sentiment: isAbusive ? 'negative' : 'positive',
      threatDetected: false,
      analysisMethod: 'mock',
      rawResponse: { mock: true },
    };
  }

  private async getMockImageAnalysis(imageData: string): Promise<AIAnalysisResult> {
    await new Promise(r => setTimeout(r, 200));
    return {
      isAbusive: false,
      categories: [],
      severityScore: 0,
      confidence: 0.98,
      sentiment: 'neutral',
      threatDetected: false,
      analysisMethod: 'mock',
      rawResponse: { mock: true },
    };
  }

  /**
   * Check AI engine health
   */
  async checkHealth(): Promise<boolean> {
    if (this.mockEnabled) return true;
    try {
      const response = await fetch(`${this.serviceUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const aiService = new AIService();
export default aiService;
