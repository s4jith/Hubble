import { Router } from 'express';
import * as childController from './child.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { validate, manualReportSchema, paginationSchema, acknowledgeAlertSchema } from '../../validations';
import { UserRole } from '../../config/constants';

const router = Router();

/**
 * Child Routes
 * All child-specific endpoints
 * Protected by authentication and child role
 */

// All routes require child authentication
router.use(authenticate);
router.use(requireRole([UserRole.CHILD]));

// Profile
router.get('/profile', childController.getProfile);
router.put('/profile', childController.updateProfile);

// Scan history  
router.get('/scan-history', validate(paginationSchema), childController.getScanHistory);
router.get('/scans', validate(paginationSchema), childController.getScanHistory);

// Alerts
router.get('/alerts', validate(paginationSchema), childController.getAlerts);
router.post('/alerts/:alertId/acknowledge', validate(acknowledgeAlertSchema), childController.acknowledgeAlert);

// Mental health resources
router.get('/resources', childController.getResources);
router.get('/resources/emergency', childController.getEmergencyResources);

// Manual reporting
router.post('/report', validate(manualReportSchema), childController.submitReport);

export default router;
