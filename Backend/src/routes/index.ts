import { Router, Request, Response } from 'express';
import { authRoutes } from '../modules/auth';
import { parentRoutes } from '../modules/parent';
import { childRoutes } from '../modules/child';
import { scanRoutes } from '../modules/scan';
import { alertRoutes } from '../modules/alerts';
import { database } from '../config/database';
import { sendSuccess } from '../utils/response';
import { socketService } from '../sockets';

const router = Router();

/**
 * API Routes
 * Central routing configuration
 */

// Health check endpoint
router.get('/health', (_req: Request, res: Response) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: database.getConnectionStatus() ? 'connected' : 'disconnected',
    sockets: {
      connected: socketService.getConnectedUsersCount(),
    },
  };

  sendSuccess(res, healthCheck);
});

// API version info
router.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, {
    name: 'Hubble API',
    version: '1.0.0',
    description: 'AI-powered Cyberbullying Detection & Prevention Backend',
    documentation: '/api/docs',
  });
});

// Mount module routes
router.use('/auth', authRoutes);
router.use('/parent', parentRoutes);
router.use('/child', childRoutes);
router.use('/scan', scanRoutes);
router.use('/alerts', alertRoutes);

export default router;
