import { Router, Request, Response } from 'express';
import { database } from '../../config/database';

/**
 * Health Check Routes
 * System health and status endpoints
 */
const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - System
 *     summary: Health check endpoint
 *     description: Returns API health status and component checks
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 database:
 *                   type: string
 *                   example: connected
 *                 uptime:
 *                   type: number
 *                   example: 12345.67
 */
router.get('/', async (_req: Request, res: Response) => {
  const dbStatus = database.getConnectionStatus() ? 'connected' : 'disconnected';
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

export default router;
