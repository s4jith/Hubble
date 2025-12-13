import { AbuseCategory } from '../../config/constants';
import { logger } from '../../utils/logger';

/**
 * Keyword Classification Result
 */
export interface KeywordClassificationResult {
  isAbusive: boolean;
  detectedCategories: AbuseCategory[];
  matchedKeywords: string[];
  severityScore: number;
  confidence: number;
  needsAdvancedAnalysis: boolean;
}

/**
 * Keyword Mapping for Text Classification
 * Fast pre-screening before sending to AI service
 */
export class KeywordClassifier {
  private readonly keywordMappings: Map<AbuseCategory, string[]>;
  
  constructor() {
    this.keywordMappings = this.initializeKeywordMappings();
  }

  /**
   * Initialize keyword mappings for each abuse category
   */
  private initializeKeywordMappings(): Map<AbuseCategory, string[]> {
    return new Map([
      // Threats and Violence
      [AbuseCategory.THREAT, [
        'kill', 'murder', 'hurt', 'attack', 'beat', 'stab', 'shoot', 'gun', 'knife',
        'destroy', 'eliminate', 'die', 'death', 'weapon', 'fight', 'assault',
        'punch', 'kick', 'slap', 'hit', 'harm', 'injure', 'damage', 'rape',
        'i will kill', 'gonna kill', 'will hurt', 'better watch', 'be sorry',
        'regret', 'revenge', 'payback', 'get you', 'come after', 'hunt you',
        'bomb', 'explosive', 'terrorism', 'violence', 'suffer', 'torture'
      ]],
      
      // Self-Harm
      [AbuseCategory.SELF_HARM, [
        'suicide', 'kill myself', 'end it all', 'cut myself', 'self harm', 'self-harm',
        'hurt myself', 'hang myself', 'overdose', 'jump off', 'slash my wrists',
        'want to die', 'better off dead', 'no point living', 'not worth living',
        'suicidal', 'ending it', 'goodbye world', 'last goodbye', 'final message',
        'give up on life', 'tired of living', 'can\'t go on', 'wanna die'
      ]],
      
      // Harassment
      [AbuseCategory.HARASSMENT, [
        'loser', 'stupid', 'idiot', 'dumb', 'moron', 'retard', 'pathetic', 'worthless',
        'useless', 'nobody', 'failure', 'freak', 'weirdo', 'creep', 'disgusting',
        'ugly', 'fat', 'pig', 'trash', 'garbage', 'scum', 'waste of space',
        'nobody likes you', 'everyone hates', 'you suck', 'kys', 'k y s',
        'go away', 'disappear', 'shut up', 'annoying', 'pest', 'attention whore'
      ]],
      
      // Bullying
      [AbuseCategory.BULLYING, [
        'bully', 'pick on', 'make fun', 'laugh at', 'embarrass', 'humiliate', 'mock',
        'tease', 'ridicule', 'shame', 'expose', 'spread rumors', 'gossip', 'exclude',
        'ignore', 'leave out', 'gang up', 'target', 'victimize', 'intimidate',
        'coward', 'wimp', 'weakling', 'cry baby', 'pussy', 'beta', 'incel',
        'nerd', 'geek', 'dork', 'loner', 'outcast', 'reject', 'abandoned'
      ]],
      
      // Hate Speech
      [AbuseCategory.HATE_SPEECH, [
        'hate', 'racist', 'racism', 'sexist', 'sexism', 'homophobic', 'transphobic',
        'nazi', 'fascist', 'supremacist', 'bigot', 'discrimination', 'prejudice',
        'ethnic slur', 'racial slur', 'terrorist', 'radical', 'extremist',
        // Note: Actual slurs are not included here for obvious reasons
        // In production, use a comprehensive hate speech database
      ]],
      
      // Sexual Content
      [AbuseCategory.SEXUAL_CONTENT, [
        'naked', 'nude', 'sex', 'sexual', 'porn', 'xxx', 'explicit', 'nsfw',
        'dick pic', 'send nudes', 'sext', 'sexting', 'horny', 'aroused',
        'masturbate', 'orgasm', 'oral sex', 'blowjob', 'handjob', 'erotic',
        'prostitute', 'escort', 'hookup', 'one night stand', 'fuck', 'fucking',
        'inappropriate touching', 'sexual assault', 'molest', 'grope', 'seduce'
      ]],
      
      // Profanity
      [AbuseCategory.PROFANITY, [
        'fuck', 'shit', 'bitch', 'ass', 'damn', 'hell', 'crap', 'piss',
        'bastard', 'asshole', 'motherfucker', 'dickhead', 'cock', 'pussy',
        'whore', 'slut', 'cunt', 'twat', 'prick', 'bollocks', 'wanker'
      ]],
      
      // Discrimination
      [AbuseCategory.DISCRIMINATION, [
        'inferior', 'superior race', 'pure blood', 'sub-human', 'not welcome',
        'go back to', 'your kind', 'you people', 'deport', 'immigrant',
        'illegal alien', 'foreign scum', 'ghetto', 'hood rat', 'redneck',
        'white trash', 'privilege', 'affirmative action', 'reverse racism'
      ]],
      
      // Spam
      [AbuseCategory.SPAM, [
        'click here', 'buy now', 'limited offer', 'free money', 'get rich quick',
        'weight loss', 'miracle cure', 'guaranteed', 'act now', 'special promotion',
        'make money fast', 'work from home', 'no experience needed', 'earn $$$',
        'bitcoin', 'crypto', 'investment opportunity', 'mlm', 'pyramid scheme'
      ]]
    ]);
  }

  /**
   * Classify text using keyword matching
   */
  classify(text: string): KeywordClassificationResult {
    const lowerText = text.toLowerCase();
    const detectedCategories: AbuseCategory[] = [];
    const matchedKeywords: string[] = [];
    let maxSeverity = 0;
    
    // Check each category
    for (const [category, keywords] of this.keywordMappings.entries()) {
      const matches = keywords.filter(keyword => lowerText.includes(keyword));
      
      if (matches.length > 0) {
        detectedCategories.push(category);
        matchedKeywords.push(...matches);
        
        // Calculate severity based on category and number of matches
        const categorySeverity = this.getCategorySeverity(category, matches.length);
        maxSeverity = Math.max(maxSeverity, categorySeverity);
      }
    }

    const isAbusive = detectedCategories.length > 0;
    
    // Determine if we need advanced AI analysis
    const needsAdvancedAnalysis = this.shouldUseAdvancedAnalysis(
      text,
      detectedCategories,
      matchedKeywords
    );

    // Calculate confidence (keyword-based is less confident than AI)
    const confidence = this.calculateConfidence(matchedKeywords.length, text.split(/\s+/).length);

    logger.info('Keyword classification complete', {
      isAbusive,
      categories: detectedCategories.length,
      keywords: matchedKeywords.length,
      needsAdvancedAnalysis
    });

    return {
      isAbusive,
      detectedCategories,
      matchedKeywords: [...new Set(matchedKeywords)], // Remove duplicates
      severityScore: maxSeverity,
      confidence,
      needsAdvancedAnalysis
    };
  }

  /**
   * Determine category severity
   */
  private getCategorySeverity(category: AbuseCategory, matchCount: number): number {
    const baseSeverity: Record<AbuseCategory, number> = {
      [AbuseCategory.SELF_HARM]: 95,
      [AbuseCategory.THREAT]: 90,
      [AbuseCategory.SEXUAL_CONTENT]: 85,
      [AbuseCategory.HATE_SPEECH]: 80,
      [AbuseCategory.HARASSMENT]: 70,
      [AbuseCategory.BULLYING]: 65,
      [AbuseCategory.DISCRIMINATION]: 75,
      [AbuseCategory.PROFANITY]: 40,
      [AbuseCategory.SPAM]: 20,
      [AbuseCategory.OTHER]: 30
    };

    const base = baseSeverity[category] || 50;
    
    // Increase severity for multiple keyword matches (up to +15)
    const matchBonus = Math.min(matchCount * 3, 15);
    
    return Math.min(base + matchBonus, 100);
  }

  /**
   * Calculate confidence based on keyword matches vs text length
   */
  private calculateConfidence(matchCount: number, wordCount: number): number {
    if (matchCount === 0) {
      return 0.95; // High confidence in "safe" classification
    }

    // More matches relative to text length = higher confidence
    const matchRatio = matchCount / Math.max(wordCount, 1);
    
    if (matchRatio > 0.3) {
      return 0.85; // Very clear abuse
    } else if (matchRatio > 0.15) {
      return 0.70; // Clear indicators
    } else if (matchRatio > 0.05) {
      return 0.55; // Some indicators, but needs verification
    } else {
      return 0.40; // Few indicators, definitely needs AI verification
    }
  }

  /**
   * Determine if advanced AI analysis is needed
   */
  private shouldUseAdvancedAnalysis(
    text: string,
    categories: AbuseCategory[],
    keywords: string[]
  ): boolean {
    // Always use AI for critical categories
    const criticalCategories = [
      AbuseCategory.SELF_HARM,
      AbuseCategory.THREAT,
      AbuseCategory.SEXUAL_CONTENT
    ];
    
    if (categories.some(cat => criticalCategories.includes(cat))) {
      return true;
    }

    // Use AI if low confidence (few keywords relative to text length)
    const wordCount = text.split(/\s+/).length;
    const matchRatio = keywords.length / Math.max(wordCount, 1);
    
    if (matchRatio < 0.1 && categories.length > 0) {
      return true; // Ambiguous, needs context understanding
    }

    // Use AI for longer messages with potential context issues
    if (wordCount > 50 && categories.length > 0) {
      return true; // Context matters in longer messages
    }

    // Use AI if no keywords detected but text is suspicious
    if (categories.length === 0 && this.containsSuspiciousPatterns(text)) {
      return true;
    }

    return false;
  }

  /**
   * Detect suspicious patterns that keywords might miss
   */
  private containsSuspiciousPatterns(text: string): boolean {
    const lowerText = text.toLowerCase();
    
    // Excessive punctuation or caps (anger indicators)
    const excessiveCaps = (text.match(/[A-Z]/g) || []).length / text.length > 0.6;
    const excessivePunctuation = (text.match(/[!?]{2,}/g) || []).length > 2;
    
    // Coded language (leetspeak, spacing, symbols)
    const hasLeetspeak = /[0-9@$]{2,}/.test(text);
    const hasExcessiveSpacing = /[a-z]\s[a-z]\s[a-z]/.test(lowerText);
    
    // Threatening sentence structures
    const threateningStructures = [
      /i('m| am) (going to|gonna|will)/,
      /you (will|gonna|better)/,
      /just wait/,
      /you('ll| will) (see|regret|pay)/
    ];
    
    const hasThreateningStructure = threateningStructures.some(pattern => 
      pattern.test(lowerText)
    );

    return excessiveCaps || excessivePunctuation || hasLeetspeak || 
           hasExcessiveSpacing || hasThreateningStructure;
  }

  /**
   * Add custom keywords to a category (for dynamic updates)
   */
  addKeywords(category: AbuseCategory, keywords: string[]): void {
    const existing = this.keywordMappings.get(category) || [];
    this.keywordMappings.set(category, [...existing, ...keywords]);
    logger.info(`Added ${keywords.length} keywords to ${category}`);
  }

  /**
   * Get all keywords for a category
   */
  getKeywords(category: AbuseCategory): string[] {
    return this.keywordMappings.get(category) || [];
  }
}

export const keywordClassifier = new KeywordClassifier();
export default keywordClassifier;
