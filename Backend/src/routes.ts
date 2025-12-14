import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import scanRoutes from './modules/scan/scan.routes';
import alertRoutes from './modules/alerts/alert.routes';
import parentRoutes from './modules/parent/parent.routes';
import childRoutes from './modules/child/child.routes';
import healthRoutes from './modules/health/health.routes';
import userRoutes from './modules/users/user.routes';
import notificationRoutes from './modules/notifications/notification.routes';
import feedRoutes from './modules/feed/feed.routes';
import complaintRoutes from './modules/complaints/complaint.routes';
import chatRoutes from './modules/chat/chat.routes';

/**
 * Main API Router
 * Aggregates all module routes
 */
const router = Router();

// Module routes
router.use('/auth', authRoutes);
router.use('/scan', scanRoutes);
router.use('/alerts', alertRoutes);
router.use('/parent', parentRoutes);
router.use('/child', childRoutes);
router.use('/health', healthRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/feed', feedRoutes);
router.use('/complaints', complaintRoutes);
router.use('/chat', chatRoutes);

export default router;
