import { Request, Response, NextFunction } from 'express';
import { chatService } from './chat.service';
import { sendSuccess } from '../../utils/response';
import { HTTP_STATUS } from '../../config/constants';

/**
 * Chat Controller
 * Handles HTTP requests for AI chatbot operations
 */
class ChatController {
  /**
   * Create a new chat session
   * POST /chat/sessions
   */
  async createSession(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { title } = req.body;

      const session = await chatService.createSession(userId, title);

      sendSuccess(res, session, 'Chat session created', HTTP_STATUS.CREATED);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get or create active session
   * GET /chat/sessions/active
   */
  async getActiveSession(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const session = await chatService.getOrCreateSession(userId);

      sendSuccess(res, session, 'Active session retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all chat sessions
   * GET /chat/sessions
   */
  async getSessions(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { page, limit, activeOnly } = req.query;

      const result = await chatService.getSessions(userId, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        activeOnly: activeOnly === 'true',
      });

      sendSuccess(res, result, 'Chat sessions retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific session
   * GET /chat/sessions/:id
   */
  async getSession(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;

      const session = await chatService.getSession(id, userId);

      sendSuccess(res, session, 'Chat session retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send a message
   * POST /chat/sessions/:id/messages
   */
  async sendMessage(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;
      const { content } = req.body;

      const result = await chatService.sendMessage(id, userId, content);

      sendSuccess(res, result, 'Message sent');
    } catch (error) {
      next(error);
    }
  }

  /**
   * End a chat session
   * POST /chat/sessions/:id/end
   */
  async endSession(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;

      const session = await chatService.endSession(id, userId);

      sendSuccess(res, session, 'Chat session ended');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's chat score
   * GET /chat/score
   */
  async getUserScore(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const score = await chatService.getUserScore(userId);

      sendSuccess(res, score, 'User score retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear chat history
   * DELETE /chat/history
   */
  async clearHistory(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const result = await chatService.clearHistory(userId);

      sendSuccess(res, result, 'Chat history cleared');
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
