import { AbuseCategory } from '../../config/constants';
import { logger } from '../../utils/logger';
import { ExternalServiceError } from '../../utils/errors';

/**
 * Gemini API Response Interface
 */
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason?: string;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
}

/**
 * Gemini Analysis Result
 */
export interface GeminiAnalysisResult {
  isAbusive: boolean;
  categories: AbuseCategory[];
  severityScore: number;
  confidence: number;
  sentiment: string;
  threatDetected: boolean;
  explanation: string;
  rawResponse?: any;
}

/**
 * Gemini API Client
 * Handles text and image analysis using Google's Generative AI
 */
export class GeminiClient {
  private readonly apiKeys: string[];
  private currentKeyIndex: number;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly timeout: number;

  constructor(apiKeys: string | string[], timeout: number = 30000) {
    this.apiKeys = Array.isArray(apiKeys) ? apiKeys : [apiKeys];
    this.currentKeyIndex = 0;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    this.model = 'gemini-2.0-flash-exp';
    this.timeout = timeout;
    
    logger.info(`Gemini client initialized with ${this.apiKeys.length} API key(s)`);
  }

  /**
   * Get current API key
   */
  private getCurrentKey(): string {
    return this.apiKeys[this.currentKeyIndex];
  }

  /**
   * Rotate to next API key
   */
  private rotateKey(): void {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    logger.info(`Rotated to API key ${this.currentKeyIndex + 1}/${this.apiKeys.length}`);
  }

  /**
   * Analyze text content for harmful content
   */
  async analyzeText(text: string): Promise<GeminiAnalysisResult> {
    const prompt = this.buildTextAnalysisPrompt(text);
    
    for (let attempt = 0; attempt < this.apiKeys.length; attempt++) {
      try {
        const response = await this.callGeminiAPI(prompt);
        return this.parseTextResponse(response);
      } catch (error: any) {
        logger.warn(`Gemini API attempt ${attempt + 1} failed`, { error: error.message });
        
        // Rotate key on rate limit or quota errors
        if (error.message.includes('429') || error.message.includes('quota')) {
          this.rotateKey();
        } else {
          throw error; // Don't retry on other errors
        }
      }
    }
    
    throw new ExternalServiceError('Gemini API (all keys exhausted)');
  }

  /**
   * Analyze image content for harmful content
   */
  async analyzeImage(imageData: string): Promise<GeminiAnalysisResult> {
    const prompt = this.buildImageAnalysisPrompt();
    
    // Extract base64 data if it's a data URL
    let base64Data = imageData;
    if (imageData.startsWith('data:')) {
      const matches = imageData.match(/^data:image\/\w+;base64,(.+)$/);
      if (matches && matches[1]) {
        base64Data = matches[1];
      }
    }
    
    for (let attempt = 0; attempt < this.apiKeys.length; attempt++) {
      try {
        const response = await this.callGeminiAPIWithImage(prompt, base64Data);
        return this.parseImageResponse(response);
      } catch (error: any) {
        logger.warn(`Gemini image API attempt ${attempt + 1} failed`, { error: error.message });
        
        if (error.message.includes('429') || error.message.includes('quota')) {
          this.rotateKey();
        } else {
          throw error;
        }
      }
    }
    
    throw new ExternalServiceError('Gemini Image API (all keys exhausted)');
  }

  /**
   * Build text analysis prompt
   */
  private buildTextAnalysisPrompt(text: string): string {
    return `You are an AI content moderator analyzing text for cyberbullying and harmful content targeting minors (under 18).

Analyze this text and classify it into these categories:
- THREAT: Threats of violence, harm, or danger
- SELF_HARM: Mentions of suicide, self-injury, or suicidal thoughts
- HARASSMENT: Personal attacks, insults, name-calling
- BULLYING: Intimidation, exclusion, humiliation
- HATE_SPEECH: Racism, discrimination, hate based on identity
- SEXUAL_CONTENT: Sexual messages, grooming, inappropriate advances
- PROFANITY: Strong language and curse words
- DISCRIMINATION: Prejudice based on race, gender, religion, etc.
- SPAM: Unwanted promotional or repetitive content

Text to analyze:
"${text}"

Respond in this exact JSON format:
{
  "isAbusive": true/false,
  "categories": ["CATEGORY1", "CATEGORY2"],
  "severityScore": 0-100,
  "confidence": 0.0-1.0,
  "sentiment": "positive/negative/neutral/mixed",
  "threatDetected": true/false,
  "explanation": "Brief explanation of the classification"
}

Be strict in protecting minors. Consider context, sarcasm, and intent.`;
  }

  /**
   * Build image analysis prompt
   */
  private buildImageAnalysisPrompt(): string {
    return `You are an AI content moderator analyzing images for content unsuitable for minors (under 18).

Analyze this image for:
- Violence, weapons, gore, fighting
- Nudity, sexual content, explicit material
- Drug use, alcohol abuse
- Self-harm imagery, suicide-related content
- Hate symbols, extremist content
- Disturbing or graphic content

Respond in this exact JSON format:
{
  "isAbusive": true/false,
  "categories": ["THREAT", "SEXUAL_CONTENT", etc.],
  "severityScore": 0-100,
  "confidence": 0.0-1.0,
  "sentiment": "negative/neutral",
  "threatDetected": true/false,
  "explanation": "Description of what was found"
}

Be protective of minors. Flag anything inappropriate for under 18.`;
  }

  /**
   * Call Gemini API with text prompt
   */
  private async callGeminiAPI(prompt: string): Promise<GeminiResponse> {
    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.getCurrentKey()}`;
    
    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500,
        topP: 0.8,
        topK: 10
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
      ]
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
      }

      return (await response.json()) as GeminiResponse;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Gemini API request timeout');
      }
      throw error;
    }
  }

  /**
   * Call Gemini API with image
   */
  private async callGeminiAPIWithImage(prompt: string, base64Image: string): Promise<GeminiResponse> {
    const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.getCurrentKey()}`;
    
    const payload = {
      contents: [{
        parts: [
          { text: prompt },
          { 
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
      ]
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
      }

      return (await response.json()) as GeminiResponse;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Gemini API image request timeout');
      }
      throw error;
    }
  }

  /**
   * Parse text analysis response
   */
  private parseTextResponse(response: GeminiResponse): GeminiAnalysisResult {
    try {
      const text = response.candidates[0]?.content?.parts[0]?.text;
      
      if (!text) {
        throw new Error('No response text from Gemini');
      }

      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON in Gemini response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        isAbusive: parsed.isAbusive || false,
        categories: this.mapCategories(parsed.categories || []),
        severityScore: this.normalizeSeverity(parsed.severityScore),
        confidence: this.normalizeConfidence(parsed.confidence),
        sentiment: parsed.sentiment || 'neutral',
        threatDetected: parsed.threatDetected || false,
        explanation: parsed.explanation || 'No explanation provided',
        rawResponse: response
      };
    } catch (error) {
      logger.error('Failed to parse Gemini text response', error);
      throw new ExternalServiceError('Gemini response parsing failed');
    }
  }

  /**
   * Parse image analysis response
   */
  private parseImageResponse(response: GeminiResponse): GeminiAnalysisResult {
    return this.parseTextResponse(response); // Same parsing logic
  }

  /**
   * Map Gemini categories to our AbuseCategory enum
   */
  private mapCategories(categories: string[]): AbuseCategory[] {
    const categoryMap: Record<string, AbuseCategory> = {
      'THREAT': AbuseCategory.THREAT,
      'SELF_HARM': AbuseCategory.SELF_HARM,
      'HARASSMENT': AbuseCategory.HARASSMENT,
      'BULLYING': AbuseCategory.BULLYING,
      'HATE_SPEECH': AbuseCategory.HATE_SPEECH,
      'SEXUAL_CONTENT': AbuseCategory.SEXUAL_CONTENT,
      'PROFANITY': AbuseCategory.PROFANITY,
      'DISCRIMINATION': AbuseCategory.DISCRIMINATION,
      'SPAM': AbuseCategory.SPAM
    };

    return categories
      .map(cat => categoryMap[cat.toUpperCase()])
      .filter(Boolean);
  }

  /**
   * Normalize severity score to 0-100 range
   */
  private normalizeSeverity(score: any): number {
    const num = Number(score);
    if (isNaN(num)) return 50;
    return Math.max(0, Math.min(100, num));
  }

  /**
   * Normalize confidence to 0-1 range
   */
  private normalizeConfidence(confidence: any): number {
    const num = Number(confidence);
    if (isNaN(num)) return 0.5;
    return Math.max(0, Math.min(1, num));
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.analyzeText('test');
      return true;
    } catch {
      return false;
    }
  }
}

export default GeminiClient;
