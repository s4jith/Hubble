import { Router } from 'express';
import * as parentController from './parent.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { validate, updateSettingsSchema, paginationSchema } from '../../validations';
import { UserRole } from '../../config/constants';

const router = Router();

/**
 * Parent Routes
 * All parent-specific endpoints
 * Protected by authentication and parent role
 */

// All routes require parent authentication
router.use(authenticate);
router.use(requireRole([UserRole.PARENT]));

// Children management
router.get('/children', parentController.getChildren);
router.get('/children/:childId', parentController.getChild);

// Incidents
router.get('/incidents', validate(paginationSchema), parentController.getIncidents);

// Alerts
router.get('/alerts', validate(paginationSchema), parentController.getAlerts);

// Analytics
router.get('/analytics', parentController.getAnalytics);

// Settings
router.get('/settings', parentController.getSettings);
router.patch('/settings', validate(updateSettingsSchema), parentController.updateSettings);

// Dashboard
router.get('/dashboard', parentController.getDashboard);

export default router;
