import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes';
import scanRoutes from './modules/scan/scan.routes';
import alertRoutes from './modules/alerts/alert.routes';
import parentRoutes from './modules/parent/parent.routes';
import childRoutes from './modules/child/child.routes';
import healthRoutes from './modules/health/health.routes';

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

export default router;
