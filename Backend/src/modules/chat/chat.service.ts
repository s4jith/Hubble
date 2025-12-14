import mongoose from 'mongoose';
import { ChatSession, IChatSession, IChatMessage, MessageSender, MessageType } from './chat.model';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

// Google Generative AI for Gemini
let genAI: any = null;
let geminiModel: any = null;

// Initialize Gemini if available
const initializeGemini = async () => {
  if (geminiModel) return geminiModel;
  
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    if (env.gemini?.apiKey) {
      genAI = new GoogleGenerativeAI(env.gemini.apiKey);
      geminiModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      logger.info('Gemini AI initialized for chat');
    }
  } catch (error) {
    logger.warn('Gemini AI not available for chat, using fallback responses');
  }
  
  return geminiModel;
};

/**
 * Chat Service
 * Handles AI chatbot conversations
 */
class ChatService {
  private readonly systemPrompt = `You are Hubble, a friendly and supportive AI assistant designed to help protect children and families from cyberbullying. Your role is to:

1. Listen empathetically to users who may be experiencing cyberbullying
2. Provide age-appropriate advice and resources
3. Encourage users to speak with trusted adults
4. Offer coping strategies and emotional support
5. Never provide harmful advice or encourage negative behavior
6. Be supportive, understanding, and non-judgmental

If a user describes an emergency or immediate danger, encourage them to contact emergency services or a trusted adult immediately.

Respond in a warm, friendly tone while being helpful and informative.`;

  /**
   * Create a new chat session
   */
  async createSession(userId: string, title?: string): Promise<IChatSession> {
    // Check for existing active session
    const existingSession = await ChatSession.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true,
    });

    if (existingSession) {
      return existingSession;
    }

    const session = await ChatSession.create({
      userId: new mongoose.Types.ObjectId(userId),
      title: title || 'New Conversation',
      messages: [
        {
          id: new mongoose.Types.ObjectId().toString(),
          sender: MessageSender.BOT,
          type: MessageType.TEXT,
          content: "Hi! I'm Hubble, your friendly safety companion. How can I help you today? Remember, you can talk to me about anything that's bothering you online. 🛡️",
          timestamp: new Date(),
        },
      ],
      messageCount: 1,
      lastMessageAt: new Date(),
    });

    logger.info(`Chat session created for user ${userId}`);
    return session;
  }

  /**
   * Get active session or create new one
   */
  async getOrCreateSession(userId: string): Promise<IChatSession> {
    const session = await ChatSession.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true,
    });

    if (session) {
      return session;
    }

    return this.createSession(userId);
  }

  /**
   * Get chat sessions for a user
   */
  async getSessions(
    userId: string,
    options: { page?: number; limit?: number; activeOnly?: boolean } = {}
  ): Promise<{
    sessions: IChatSession[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, activeOnly = false } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { userId: new mongoose.Types.ObjectId(userId) };
    if (activeOnly) {
      query.isActive = true;
    }

    const [sessions, total] = await Promise.all([
      ChatSession.find(query)
        .select('-messages')
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ChatSession.countDocuments(query),
    ]);

    return {
      sessions: sessions as unknown as IChatSession[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a session with messages
   */
  async getSession(sessionId: string, userId: string): Promise<IChatSession> {
    const session = await ChatSession.findOne({
      _id: new mongoose.Types.ObjectId(sessionId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!session) {
      throw new NotFoundError('Chat session not found');
    }

    return session;
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(
    sessionId: string,
    userId: string,
    content: string
  ): Promise<{ userMessage: IChatMessage; botResponse: IChatMessage; session: IChatSession }> {
    const session = await ChatSession.findOne({
      _id: new mongoose.Types.ObjectId(sessionId),
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true,
    });

    if (!session) {
      throw new NotFoundError('Active chat session not found');
    }

    // Create user message
    const userMessage: IChatMessage = {
      id: new mongoose.Types.ObjectId().toString(),
      sender: MessageSender.USER,
      type: MessageType.TEXT,
      content,
      timestamp: new Date(),
    };

    session.messages.push(userMessage);
    session.messageCount += 1;

    // Generate AI response
    const botResponseContent = await this.generateResponse(session.messages, content);

    // Create bot message
    const botResponse: IChatMessage = {
      id: new mongoose.Types.ObjectId().toString(),
      sender: MessageSender.BOT,
      type: MessageType.TEXT,
      content: botResponseContent,
      timestamp: new Date(),
    };

    session.messages.push(botResponse);
    session.messageCount += 1;
    session.lastMessageAt = new Date();

    // Update user score based on conversation (simplified)
    await this.updateUserScore(session, content);

    await session.save();

    return { userMessage, botResponse, session };
  }

  /**
   * Generate AI response using Gemini or fallback
   */
  private async generateResponse(messages: IChatMessage[], userInput: string): Promise<string> {
    try {
      const model = await initializeGemini();
      
      if (model) {
        // Build conversation history
        const history = messages.slice(-10).map((msg) => ({
          role: msg.sender === MessageSender.USER ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }));

        const chat = model.startChat({
          history,
          generationConfig: {
            maxOutputTokens: 500,
          },
        });

        const result = await chat.sendMessage(`${this.systemPrompt}\n\nUser: ${userInput}`);
        return result.response.text();
      }
    } catch (error) {
      logger.error('Gemini API error:', error);
    }

    // Fallback responses
    return this.getFallbackResponse(userInput);
  }

  /**
   * Get fallback response when AI is unavailable
   */
  private getFallbackResponse(input: string): string {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('bully') || lowerInput.includes('harass')) {
      return "I'm really sorry to hear you're dealing with this. Bullying is never okay, and you're brave for talking about it. Remember, it's not your fault. Would you like me to share some resources that might help, or would you prefer to tell me more about what's happening?";
    }

    if (lowerInput.includes('help') || lowerInput.includes('scared')) {
      return "I'm here for you. It takes courage to ask for help. If you're in immediate danger, please reach out to a trusted adult or call emergency services. Otherwise, let's talk about what's going on and figure out the best way to help you.";
    }

    if (lowerInput.includes('thank')) {
      return "You're very welcome! Remember, I'm always here if you need someone to talk to. Stay safe! 💙";
    }

    if (lowerInput.includes('report') || lowerInput.includes('tell')) {
      return "Reporting is a really important step. You can use our report feature to document what's happening, and we can help guide you through the process. Would you like me to explain how that works?";
    }

    return "Thank you for sharing that with me. I'm here to listen and help however I can. Could you tell me a bit more about what's going on so I can better understand how to support you?";
  }

  /**
   * Update user score based on conversation content
   */
  private async updateUserScore(session: IChatSession, userInput: string): Promise<void> {
    const lowerInput = userInput.toLowerCase();
    
    // Keywords that might indicate risk
    const riskKeywords = ['hurt', 'harm', 'scared', 'afraid', 'bully', 'harass', 'threat', 'hate', 'kill', 'die'];
    const positiveKeywords = ['thank', 'better', 'happy', 'safe', 'help', 'good'];

    let scoreChange = 0;

    for (const keyword of riskKeywords) {
      if (lowerInput.includes(keyword)) {
        scoreChange -= 2;
      }
    }

    for (const keyword of positiveKeywords) {
      if (lowerInput.includes(keyword)) {
        scoreChange += 1;
      }
    }

    session.userScore = Math.max(0, Math.min(100, session.userScore + scoreChange));
  }

  /**
   * End a chat session
   */
  async endSession(sessionId: string, userId: string): Promise<IChatSession> {
    const session = await ChatSession.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(sessionId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      {
        isActive: false,
        endedAt: new Date(),
      },
      { new: true }
    );

    if (!session) {
      throw new NotFoundError('Chat session not found');
    }

    return session;
  }

  /**
   * Get user's overall chat score
   */
  async getUserScore(userId: string): Promise<{
    score: number;
    category: 'safe' | 'moderate' | 'at_risk';
    totalSessions: number;
  }> {
    const sessions = await ChatSession.find({
      userId: new mongoose.Types.ObjectId(userId),
    }).select('userScore').lean();

    if (sessions.length === 0) {
      return { score: 100, category: 'safe', totalSessions: 0 };
    }

    const avgScore = sessions.reduce((sum, s) => sum + s.userScore, 0) / sessions.length;
    let category: 'safe' | 'moderate' | 'at_risk';

    if (avgScore >= 70) {
      category = 'safe';
    } else if (avgScore >= 40) {
      category = 'moderate';
    } else {
      category = 'at_risk';
    }

    return {
      score: Math.round(avgScore),
      category,
      totalSessions: sessions.length,
    };
  }

  /**
   * Delete chat history
   */
  async clearHistory(userId: string): Promise<{ deletedCount: number }> {
    const result = await ChatSession.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
      isActive: false,
    });

    return { deletedCount: result.deletedCount };
  }
}

export const chatService = new ChatService();
