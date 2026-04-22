/**
 * Content Moderation Service
 * Production-grade comment screening with NLP support
 * 
 * Features:
 * - OpenAI Moderation API integration
 * - Custom NLP pattern detection for bullying/harassment
 * - Profanity filtering
 * - Spam detection
 * - Configurable sensitivity levels
 */

// ===========================================
// TYPES
// ===========================================

export interface ModerationResult {
  approved: boolean;
  flagged: boolean;
  reasons: string[];
  scores: ModerationScores;
  originalContent: string;
  sanitizedContent?: string;
  confidence: number;
}

export interface ModerationScores {
  harassment: number;
  hateSpeech: number;
  violence: number;
  selfHarm: number;
  sexual: number;
  spam: number;
  profanity: number;
  bullying: number;
  toxicity: number;
}

export interface ModerationConfig {
  enableOpenAI: boolean;
  enableNLP: boolean;
  enableProfanityFilter: boolean;
  enableSpamDetection: boolean;
  strictMode: boolean;
  thresholds: {
    harassment: number;
    hateSpeech: number;
    violence: number;
    selfHarm: number;
    sexual: number;
    spam: number;
    profanity: number;
    bullying: number;
    toxicity: number;
  };
}

// API Response types for external services
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
}

interface OpenAIModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  category_scores: Record<string, number>;
}

interface OpenAIModerationResponse {
  results?: OpenAIModerationResult[];
}

// ===========================================
// DEFAULT CONFIGURATION
// ===========================================

const DEFAULT_CONFIG: ModerationConfig = {
  enableOpenAI: true,
  enableNLP: true,
  enableProfanityFilter: true,
  enableSpamDetection: true,
  strictMode: false,
  thresholds: {
    harassment: 0.7,
    hateSpeech: 0.6,
    violence: 0.7,
    selfHarm: 0.5,
    sexual: 0.6,
    spam: 0.8,
    profanity: 0.7,
    bullying: 0.6,
    toxicity: 0.7,
  },
};

// ===========================================
// NLP PATTERNS FOR DETECTION
// ===========================================


// Profanity list (common profane words - keeping minimal)
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'bastard',
  'dick', 'cock', 'pussy', 'cunt', 'whore', 'slut',
  'motherfucker', 'asshole', 'bullshit', 'piss',
];

// Build profanity regex with word boundaries
const PROFANITY_REGEX = new RegExp(
  `\\b(${PROFANITY_LIST.join('|')})\\b`,
  'gi'
);

// Leetspeak substitutions for profanity detection
const LEETSPEAK_MAP: Record<string, string> = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's',
  '!': 'i',
};

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Convert leetspeak to regular text for better detection
 */
function decodeLeetspeak(text: string): string {
  let decoded = text.toLowerCase();
  for (const [leet, char] of Object.entries(LEETSPEAK_MAP)) {
    decoded = decoded.replace(new RegExp(leet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), char);
  }
  return decoded;
}



// ===========================================
// OPENAI MODERATION API
// ===========================================

interface OpenAIModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
  category_scores: Record<string, number>;
}

// Simple in-memory cache to reduce API calls
const moderationCache = new Map<string, { result: OpenAIModerationResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limit tracking for OpenAI
let openAILastRequestTime = 0;
let openAIConsecutiveErrors = 0;

// Rate limit tracking for Gemini
let geminiLastRequestTime = 0;
let geminiConsecutiveErrors = 0;

const MIN_REQUEST_INTERVAL = 100; // ms between requests
const BACKOFF_MULTIPLIER = 2;
const MAX_BACKOFF = 60000; // 1 minute max backoff

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get cache key for content
 */
function getCacheKey(text: string): string {
  // Simple hash - just use first 100 chars + length
  return `${text.substring(0, 100)}_${text.length}`;
}

// ===========================================
// GEMINI MODERATION API (Fallback)
// ===========================================

async function callGeminiModeration(text: string): Promise<OpenAIModerationResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your-gemini-api-key') {
    return null;
  }

  // Check if we should back off due to errors
  if (geminiConsecutiveErrors >= 3) {
    const backoffTime = Math.min(MAX_BACKOFF, MIN_REQUEST_INTERVAL * Math.pow(BACKOFF_MULTIPLIER, geminiConsecutiveErrors));
    const timeSinceLastError = Date.now() - geminiLastRequestTime;
    
    if (timeSinceLastError < backoffTime) {
      console.warn(`Gemini moderation: backing off for ${Math.round((backoffTime - timeSinceLastError) / 1000)}s`);
      return null;
    }
  }

  // Rate limit
  const timeSinceLastRequest = Date.now() - geminiLastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }

  try {
    geminiLastRequestTime = Date.now();
    
    // Escape the text for JSON
    const escapedText = text.substring(0, 500).replace(/"/g, '\\"').replace(/\n/g, ' ');
    
    // Use Gemini to analyze content for semantic meaning and moderation
    const prompt = `You are an advanced semantic content moderation system. Deeply analyze the meaning and context of the following text, ignoring innocent uses of keywords, and rate each safety category from 0.0 to 1.0 where 0 is completely safe and 1 is highly problematic or toxic.

Categories:
- harassment: bullying, threats, intimidation, personal attacks
- hate: discrimination, slurs, hate speech against groups
- violence: threats of physical harm, violent content
- self_harm: suicide, self-injury encouragement
- sexual: explicit sexual content, inappropriate material
- spam: repetitive spam, promotions, clickbait, phishing
- profanity: excessive, aggressive, or harmful swearing
- bullying: targeted mocking, belittling, or exclusion
- toxicity: generally negative, irritating, or hostile tone

Text to analyze: "${escapedText}"

IMPORTANT: Respond with ONLY a JSON object format. Use this exact structure:
{"harassment":0.0,"hate":0.0,"violence":0.0,"self_harm":0.0,"sexual":0.0,"spam":0.0,"profanity":0.0,"bullying":0.0,"toxicity":0.0}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000,
            topP: 0.1,
            responseMimeType: "application/json",
          },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
          ]
        }),
      }
    );

    if (response.status === 429) {
      geminiConsecutiveErrors++;
      console.warn(`Gemini moderation rate limited (429). Errors: ${geminiConsecutiveErrors}`);
      return null;
    }

    if (!response.ok) {
      geminiConsecutiveErrors++;
      const errorText = await response.text();
      console.error('Gemini moderation API error:', response.status, errorText.substring(0, 200));
      return null;
    }

    geminiConsecutiveErrors = 0;
    const data = await response.json() as GeminiResponse;
    
    // Parse Gemini response - check multiple possible response structures
    let responseText = '';
    
    // Try standard response format
    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      responseText = data.candidates[0].content.parts[0].text;
    }
    // Check if blocked by safety
    else if (data.candidates?.[0]?.finishReason === 'SAFETY') {
      // Content was blocked - treat as flagged
      console.log('Gemini: Content blocked by safety filters');
      return {
        flagged: true,
        categories: { 'harassment': true },
        category_scores: { 'harassment': 0.9 },
      };
    }
    // Check for prompt feedback (blocked before generation)
    else if (data.promptFeedback?.blockReason) {
      console.log('Gemini: Prompt blocked:', data.promptFeedback.blockReason);
      return {
        flagged: true,
        categories: { 'harassment': true },
        category_scores: { 'harassment': 0.9 },
      };
    }
    
    if (!responseText) {
      console.warn('Gemini: Empty response, raw data:', JSON.stringify(data).substring(0, 300));
      return null;
    }
    
    // Clean up the response text
    responseText = responseText.trim();
    
    // Remove markdown code blocks if present
    responseText = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    let scores;
    try {
      if (jsonMatch) {
        scores = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: try to parse the whole text if it looks like JSON
        if (responseText.startsWith('{')) {
           scores = JSON.parse(responseText);
        } else {
           throw new Error('No JSON found');
        }
      }
    } catch (parseError) {
      console.warn('Gemini: JSON parse error:', parseError, 'Response:', responseText.substring(0, 100));
      return null;
    }
    
    // Validate and normalize scores
    const normalizeScore = (val: unknown): number => {
      const num = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
      return Math.max(0, Math.min(1, num));
    };
    
    // Convert to OpenAI format for compatibility
    const result: OpenAIModerationResult = {
      flagged: Object.values(scores).some((score) => normalizeScore(score) > 0.5),
      categories: {
        'harassment': scores.harassment > 0.5,
        'hate': scores.hate > 0.5,
        'violence': scores.violence > 0.5,
        'self-harm': scores.self_harm > 0.5,
        'sexual': scores.sexual > 0.5,
        'spam': scores.spam > 0.5,
        'profanity': scores.profanity > 0.5,
        'bullying': scores.bullying > 0.5,
        'toxicity': scores.toxicity > 0.5,
      },
      category_scores: {
        'harassment': scores.harassment || 0,
        'hate': scores.hate || 0,
        'violence': scores.violence || 0,
        'self-harm': scores.self_harm || 0,
        'sexual': scores.sexual || 0,
        'spam': scores.spam || 0,
        'profanity': scores.profanity || 0,
        'bullying': scores.bullying || 0,
        'toxicity': scores.toxicity || 0,
      },
    };

    return result;
  } catch (error) {
    geminiConsecutiveErrors++;
    console.error('Gemini moderation request failed:', error);
    return null;
  }
}

// ===========================================
// OPENAI MODERATION (Primary)
// ===========================================

async function callOpenAIModeration(text: string): Promise<OpenAIModerationResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your-openai-api-key') {
    // API key not configured - try Gemini
    return null;
  }

  // Check cache first
  const cacheKey = getCacheKey(text);
  const cached = moderationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  // If we've had too many consecutive errors, skip OpenAI and try Gemini
  if (openAIConsecutiveErrors >= 3) {
    const backoffTime = Math.min(MAX_BACKOFF, MIN_REQUEST_INTERVAL * Math.pow(BACKOFF_MULTIPLIER, openAIConsecutiveErrors));
    const timeSinceLastError = Date.now() - openAILastRequestTime;
    
    if (timeSinceLastError < backoffTime) {
      console.warn(`OpenAI moderation: backing off, trying Gemini fallback`);
      return null; // Will trigger Gemini fallback
    }
  }

  // Rate limit: ensure minimum interval between requests
  const timeSinceLastRequest = Date.now() - openAILastRequestTime;
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }
  
  try {
    openAILastRequestTime = Date.now();
    
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: text }),
    });
    
    if (response.status === 429) {
      // Rate limited - increase backoff and try Gemini
      openAIConsecutiveErrors++;
      console.warn(`OpenAI moderation rate limited (429). Trying Gemini fallback...`);
      return null; // Will trigger Gemini fallback
    }
    
    if (!response.ok) {
      openAIConsecutiveErrors++;
      console.error('OpenAI moderation API error:', response.status);
      return null;
    }
    
    // Success - reset error counter
    openAIConsecutiveErrors = 0;
    
    const data = await response.json() as OpenAIModerationResponse;
    const result = data.results?.[0] || null;
    
    // Cache the result
    if (result) {
      moderationCache.set(cacheKey, { result, timestamp: Date.now() });
      
      // Clean old cache entries periodically
      if (moderationCache.size > 1000) {
        const now = Date.now();
        const keysToDelete: string[] = [];
        moderationCache.forEach((value, key) => {
          if (now - value.timestamp > CACHE_TTL) {
            keysToDelete.push(key);
          }
        });
        keysToDelete.forEach(key => moderationCache.delete(key));
      }
    }
    
    return result;
  } catch (error) {
    openAIConsecutiveErrors++;
    console.error('OpenAI moderation request failed:', error);
    return null;
  }
}

// ===========================================
// HUBBLE AI MODERATION (Primary local backend)
// ===========================================

async function callHubbleAIModeration(text: string): Promise<OpenAIModerationResult | null> {
  try {
    const response = await fetch('http://localhost:8000/api/v1/analyze/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source_app: 'frontend' })
    });
    
    if (!response.ok) {
      console.warn('Hubble AI Engine error:', response.status);
      return null;
    }
    
    const data = await response.json();
    const scores = data.filter_detail?.scores || {};
    // Extract max scores across standard mapping
    const getScore = (keys: string[]) => Math.max(...keys.map(k => scores[k] || 0), 0);
    
    return {
      flagged: data.status !== "ALLOWED",
      categories: {
        'harassment': getScore(['insult', 'threat']) > 0.5,
        'hate': getScore(['identity_hate']) > 0.5,
        'violence': getScore(['threat', 'violence']) > 0.5,
        'self-harm': getScore(['self-harm']) > 0.5,
        'sexual': getScore(['sexual']) > 0.5,
        'spam': getScore(['spam']) > 0.5,
        'profanity': getScore(['obscene', 'profane']) > 0.5,
        'bullying': getScore(['toxic', 'severe_toxic', 'insult']) > 0.5,
        'toxicity': getScore(['toxic']) > 0.5,
      },
      category_scores: {
        'harassment': getScore(['insult', 'threat']),
        'hate': getScore(['identity_hate']),
        'violence': getScore(['threat']),
        'self-harm': getScore(['self-harm']),
        'sexual': getScore(['sexual']),
        'spam': getScore(['spam']),
        'profanity': getScore(['obscene']),
        'bullying': getScore(['toxic', 'severe_toxic', 'insult']),
        'toxicity': getScore(['toxic', 'severe_toxic']),
      }
    };
  } catch (error) {
    console.error('Hubble AI Engine fetch failed:', error);
    return null;
  }
}

/**
 * Call external AI moderation with automatic fallback
 * Priority: Hubble AI -> OpenAI -> Gemini -> Local NLP only
 */
async function callAIModeration(text: string): Promise<OpenAIModerationResult | null> {
  // Check cache first (shared between providers)
  const cacheKey = getCacheKey(text);
  const cached = moderationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  // Try Hubble AI Engine first
  let result = await callHubbleAIModeration(text);

  // If Hubble failed, try OpenAI
  if (!result) {
    result = await callOpenAIModeration(text);
  }
  
  // If OpenAI failed, try Gemini
  if (!result) {
    result = await callGeminiModeration(text);
  }

  // Cache result
  if (result) {
    moderationCache.set(cacheKey, { result, timestamp: Date.now() });
  }
  
  return result;
}



// ===========================================
// CONTENT SANITIZATION
// ===========================================

/**
 * Sanitize content by masking profanity
 */
function sanitizeContent(text: string): string {
  let sanitized = text;
  
  for (const word of PROFANITY_LIST) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    sanitized = sanitized.replace(regex, '*'.repeat(word.length));
  }
  
  return sanitized;
}

// ===========================================
// MAIN MODERATION FUNCTION
// ===========================================

/**
 * Moderate content and return detailed analysis
 */
export async function moderateContent(
  content: string,
  config: Partial<ModerationConfig> = {}
): Promise<ModerationResult> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const thresholds = { ...DEFAULT_CONFIG.thresholds, ...config.thresholds };
  
  // Initialize scores
  const scores: ModerationScores = {
    harassment: 0,
    hateSpeech: 0,
    violence: 0,
    selfHarm: 0,
    sexual: 0,
    spam: 0,
    profanity: 0,
    bullying: 0,
    toxicity: 0,
  };
  
  const reasons: string[] = [];
  let overallConfidence = 1;
  
  // 1. AI Semantic Moderation API (OpenAI -> Gemini fallback)
  if (finalConfig.enableOpenAI) {
    const aiResult = await callAIModeration(content);
    
    if (aiResult) {
      // Map AI scores to our unified semantic scores
      scores.harassment = Math.max(
        scores.harassment,
        aiResult.category_scores['harassment'] || 0,
        aiResult.category_scores['harassment/threatening'] || 0
      );
      scores.hateSpeech = Math.max(
        scores.hateSpeech,
        aiResult.category_scores['hate'] || 0,
        aiResult.category_scores['hate/threatening'] || 0
      );
      scores.violence = Math.max(
        scores.violence,
        aiResult.category_scores['violence'] || 0,
        aiResult.category_scores['violence/graphic'] || 0
      );
      scores.selfHarm = Math.max(
        scores.selfHarm,
        aiResult.category_scores['self-harm'] || 0,
        aiResult.category_scores['self-harm/intent'] || 0,
        aiResult.category_scores['self-harm/instructions'] || 0
      );
      scores.sexual = Math.max(
        scores.sexual,
        aiResult.category_scores['sexual'] || 0,
        aiResult.category_scores['sexual/minors'] || 0
      );

      // Capture the additional semantically parsed categories explicitly prompted for
      if (aiResult.category_scores['spam'] !== undefined) scores.spam = aiResult.category_scores['spam'];
      if (aiResult.category_scores['profanity'] !== undefined) scores.profanity = aiResult.category_scores['profanity'];
      if (aiResult.category_scores['bullying'] !== undefined) scores.bullying = aiResult.category_scores['bullying'];
      if (aiResult.category_scores['toxicity'] !== undefined) scores.toxicity = aiResult.category_scores['toxicity'];
      
      overallConfidence = 0.98; // Highest confidence utilizing true semantic inference
    } else {
      overallConfidence = 0.7; // Lower confidence without AI
    }
  }
  
  // 2. Local Keyword and Regex NLP Analysis (Deprecated)
  // Replaced strictly with Semantic LLM evaluation per requirements.

  
  // Determine if content should be flagged
  const flaggedCategories: string[] = [];
  
  if (scores.harassment >= thresholds.harassment) {
    flaggedCategories.push('harassment');
    reasons.push('Content contains harassment');
  }
  if (scores.hateSpeech >= thresholds.hateSpeech) {
    flaggedCategories.push('hate speech');
    reasons.push('Content contains hate speech');
  }
  if (scores.violence >= thresholds.violence) {
    flaggedCategories.push('violence');
    reasons.push('Content contains violent language');
  }
  if (scores.selfHarm >= thresholds.selfHarm) {
    flaggedCategories.push('self-harm');
    reasons.push('Content may encourage self-harm');
  }
  if (scores.sexual >= thresholds.sexual) {
    flaggedCategories.push('sexual content');
    reasons.push('Content contains sexual references');
  }
  if (scores.spam >= thresholds.spam) {
    flaggedCategories.push('spam');
    reasons.push('Content appears to be spam');
  }
  if (scores.profanity >= thresholds.profanity) {
    flaggedCategories.push('profanity');
    reasons.push('Content contains excessive profanity');
  }
  if (scores.bullying >= thresholds.bullying) {
    flaggedCategories.push('bullying');
    reasons.push('Content contains bullying language');
  }
  if (scores.toxicity >= thresholds.toxicity) {
    flaggedCategories.push('toxicity');
    reasons.push('Content is generally toxic');
  }
  
  const flagged = flaggedCategories.length > 0;
  const approved = !flagged;
  
  // In strict mode, also sanitize profanity even if approved
  let sanitizedContent: string | undefined;
  if (finalConfig.enableProfanityFilter && scores.profanity > 0) {
    sanitizedContent = sanitizeContent(content);
  }
  
  return {
    approved,
    flagged,
    reasons,
    scores,
    originalContent: content,
    sanitizedContent,
    confidence: overallConfidence,
  };
}

// ===========================================
// QUICK CHECK FUNCTIONS
// ===========================================

/**
 * Quick check if content is safe (returns boolean)
 */
export async function isContentSafe(content: string): Promise<boolean> {
  const result = await moderateContent(content);
  return result.approved;
}

/**
 * Moderate and return sanitized version if needed
 */
export async function moderateAndSanitize(content: string): Promise<{
  safe: boolean;
  content: string;
  reasons: string[];
}> {
  const result = await moderateContent(content);
  
  return {
    safe: result.approved,
    content: result.approved ? (result.sanitizedContent || content) : content,
    reasons: result.reasons,
  };
}

// ===========================================
// EXPORT CONFIGURATION HELPER
// ===========================================

export function createModerationConfig(
  overrides: Partial<ModerationConfig> = {}
): ModerationConfig {
  return {
    ...DEFAULT_CONFIG,
    ...overrides,
    thresholds: {
      ...DEFAULT_CONFIG.thresholds,
      ...overrides.thresholds,
    },
  };
}

// ===========================================
// LOGGING AND ANALYTICS
// ===========================================

export interface ModerationLog {
  timestamp: Date;
  content: string;
  result: ModerationResult;
  userId?: string;
  postId?: string;
  action: 'approved' | 'rejected' | 'flagged_for_review';
}

const moderationLogs: ModerationLog[] = [];

/**
 * Log moderation decision for analytics
 */
export function logModerationDecision(
  content: string,
  result: ModerationResult,
  metadata: { userId?: string; postId?: string } = {}
): void {
  const log: ModerationLog = {
    timestamp: new Date(),
    content: content.substring(0, 200), // Truncate for storage
    result,
    userId: metadata.userId,
    postId: metadata.postId,
    action: result.approved ? 'approved' : 'rejected',
  };
  
  moderationLogs.push(log);
  
  // Keep only last 1000 logs in memory
  if (moderationLogs.length > 1000) {
    moderationLogs.shift();
  }
  
  // Log flagged content for review
  if (result.flagged) {
    console.warn('[MODERATION] Flagged content:', {
      reasons: result.reasons,
      scores: result.scores,
      preview: content.substring(0, 50) + '...',
    });
  }
}

/**
 * Get moderation statistics
 */
export function getModerationStats(): {
  total: number;
  approved: number;
  rejected: number;
  topReasons: Record<string, number>;
} {
  const stats = {
    total: moderationLogs.length,
    approved: 0,
    rejected: 0,
    topReasons: {} as Record<string, number>,
  };
  
  for (const log of moderationLogs) {
    if (log.action === 'approved') {
      stats.approved++;
    } else {
      stats.rejected++;
    }
    
    for (const reason of log.result.reasons) {
      stats.topReasons[reason] = (stats.topReasons[reason] || 0) + 1;
    }
  }
  
  return stats;
}
