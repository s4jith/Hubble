import { Router } from 'express';
import { chatController } from './chat.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

/**
 * Chat Routes
 * All routes require authentication
 */

// Get user score (must be before /sessions/:id)
router.get('/score', authenticate, chatController.getUserScore);

// Clear chat history
router.delete('/history', authenticate, chatController.clearHistory);

// Get active session (must be before /sessions/:id)
router.get('/sessions/active', authenticate, chatController.getActiveSession);

// Session routes
router.get('/sessions', authenticate, chatController.getSessions);
router.post('/sessions', authenticate, chatController.createSession);
router.get('/sessions/:id', authenticate, chatController.getSession);
router.post('/sessions/:id/messages', authenticate, chatController.sendMessage);
router.post('/sessions/:id/end', authenticate, chatController.endSession);

export default router;
