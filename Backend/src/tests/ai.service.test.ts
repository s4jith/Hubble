import { AIService } from '@modules/ai/ai.service';

describe('AI Service', () => {
  let aiService: AIService;

  beforeAll(() => {
    aiService = new AIService();
  });

  describe('analyzeText', () => {
    it('should return non-abusive for safe text', async () => {
      const result = await aiService.analyzeText('Hello, how are you doing today?');

      expect(result.isAbusive).toBe(false);
      expect(result.severityScore).toBeLessThan(0.3);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.sentiment).toBeDefined();
    });

    it('should detect harassment', async () => {
      const result = await aiService.analyzeText('You are such a loser, nobody likes you');

      expect(result.isAbusive).toBe(true);
      expect(result.categories).toContain('harassment');
      expect(result.severityScore).toBeGreaterThan(0.3);
    });

    it('should detect threats', async () => {
      const result = await aiService.analyzeText('I will kill you tomorrow');

      expect(result.isAbusive).toBe(true);
      expect(result.categories).toContain('threats');
      expect(result.threatDetected).toBe(true);
      expect(result.severityScore).toBeGreaterThan(0.5);
    });

    it('should detect hate speech', async () => {
      const result = await aiService.analyzeText('I hate all people of your race');

      expect(result.isAbusive).toBe(true);
      expect(result.categories).toContain('hate_speech');
    });

    it('should detect bullying patterns', async () => {
      const result = await aiService.analyzeText('You are so ugly and fat, go cry');

      expect(result.isAbusive).toBe(true);
      expect(result.categories).toContain('bullying');
    });

    it('should detect profanity', async () => {
      const result = await aiService.analyzeText('What the damn hell is wrong with you');

      expect(result.isAbusive).toBe(true);
      expect(result.categories).toContain('profanity');
    });

    it('should detect self-harm content with high severity', async () => {
      const result = await aiService.analyzeText('I want to kill myself');

      expect(result.isAbusive).toBe(true);
      expect(result.categories).toContain('self_harm');
      expect(result.severityScore).toBeGreaterThan(0.7);
    });

    it('should detect multiple categories', async () => {
      const result = await aiService.analyzeText('You are an idiot, I hate you and will hurt you');

      expect(result.isAbusive).toBe(true);
      expect(result.categories.length).toBeGreaterThan(1);
    });

    it('should return confidence score between 0 and 1', async () => {
      const result = await aiService.analyzeText('Some random text');

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should return severity score between 0 and 1', async () => {
      const result = await aiService.analyzeText('Some random text');

      expect(result.severityScore).toBeGreaterThanOrEqual(0);
      expect(result.severityScore).toBeLessThanOrEqual(1);
    });
  });

  describe('analyzeImage', () => {
    it('should return analysis for image URL', async () => {
      const result = await aiService.analyzeImage('https://example.com/image.jpg');

      expect(result).toBeDefined();
      expect(result.isAbusive).toBeDefined();
      expect(result.severityScore).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    it('should return analysis for base64 image', async () => {
      const result = await aiService.analyzeImage('data:image/png;base64,iVBORw0KGg...');

      expect(result).toBeDefined();
      expect(result.isAbusive).toBeDefined();
    });
  });
});
