import { Router } from 'express';
import * as alertController from './alert.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { validate, acknowledgeAlertSchema, resolveAlertSchema, paginationSchema } from '../../validations';
import { UserRole } from '../../config/constants';

const router = Router();

/**
 * Alert Routes
 * All alert-related endpoints
 */

// All routes require authentication
router.use(authenticate);

// Parent-only routes
router.get(
  '/',
  requireRole([UserRole.PARENT]),
  validate(paginationSchema),
  alertController.getAlerts
);

router.get(
  '/pending/count',
  requireRole([UserRole.PARENT]),
  alertController.getPendingCount
);

router.post(
  '/:alertId/resolve',
  requireRole([UserRole.PARENT]),
  validate(resolveAlertSchema),
  alertController.resolveAlert
);

// Parent and child routes
router.get(
  '/:alertId',
  requireRole([UserRole.PARENT, UserRole.CHILD]),
  validate(acknowledgeAlertSchema),
  alertController.getAlertById
);

router.post(
  '/:alertId/acknowledge',
  requireRole([UserRole.PARENT, UserRole.CHILD]),
  validate(acknowledgeAlertSchema),
  alertController.acknowledgeAlert
);

router.put(
  '/:alertId/status',
  requireRole([UserRole.PARENT]),
  alertController.updateAlertStatus
);

router.get(
  '/stats',
  requireRole([UserRole.PARENT]),
  alertController.getAlertStats
);

export default router;
