import { Response } from 'express';
import { alertService } from './alert.service';
import { asyncHandler, sendSuccess } from '../../utils';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { SUCCESS_MESSAGES, AlertStatus, AlertSeverity } from '../../config/constants';
import { parsePagination } from '../../utils/helpers';

/**
 * Alert Controller
 * Handles HTTP requests for alert endpoints
 */

/**
 * @swagger
 * /alerts/{alertId}:
 *   get:
 *     summary: Get alert by ID
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert details
 *       404:
 *         description: Alert not found
 */
export const getAlertById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { alertId } = req.params;

  const alert = await alertService.getAlertById(alertId, userId);

  sendSuccess(res, { alert });
});

/**
 * @swagger
 * /alerts/{alertId}/acknowledge:
 *   post:
 *     summary: Acknowledge an alert
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert acknowledged
 */
export const acknowledgeAlert = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { userId, role } = req.user!;
  const { alertId } = req.params;

  const alert = await alertService.acknowledgeAlert(alertId, userId, role);

  sendSuccess(res, { alert }, SUCCESS_MESSAGES.ALERT_ACKNOWLEDGED);
});

/**
 * @swagger
 * /alerts/{alertId}/resolve:
 *   post:
 *     summary: Resolve an alert (parent only)
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resolutionNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Alert resolved
 */
export const resolveAlert = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parentId = req.user!.userId;
  const { alertId } = req.params;
  const { resolutionNotes } = req.body;

  const alert = await alertService.resolveAlert(alertId, parentId, resolutionNotes);

  sendSuccess(res, { alert }, 'Alert resolved successfully');
});

/**
 * @swagger
 * /alerts:
 *   get:
 *     summary: Get alerts (parent only)
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, acknowledged, resolved, escalated]
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *     responses:
 *       200:
 *         description: List of alerts
 */
export const getAlerts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parentId = req.user!.userId;
  const { page, limit } = parsePagination(req.query.page as string, req.query.limit as string);
  const { status, severity } = req.query;

  const result = await alertService.getParentAlerts(parentId, page, limit, {
    status: status as AlertStatus,
    severity: severity as AlertSeverity,
  });

  sendSuccess(res, result);
});

/**
 * @swagger
 * /alerts/pending/count:
 *   get:
 *     summary: Get pending alerts count (parent only)
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending count
 */
export const getPendingCount = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parentId = req.user!.userId;

  const count = await alertService.getPendingCount(parentId);

  sendSuccess(res, { pendingCount: count });
});

/**
 * @swagger
 * /alerts/{alertId}/status:
 *   put:
 *     summary: Update alert status (parent only)
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, acknowledged, reviewed, resolved]
 *     responses:
 *       200:
 *         description: Alert status updated
 */
export const updateAlertStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { alertId } = req.params;
  const { status } = req.body;

  const alert = await alertService.updateAlertStatus(alertId, userId, status);

  sendSuccess(res, { alert });
});

/**
 * @swagger
 * /alerts/stats:
 *   get:
 *     summary: Get alert statistics (parent only)
 *     tags: [Alerts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: childId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Alert statistics
 */
export const getAlertStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parentId = req.user!.userId;
  const { childId } = req.query;

  const stats = await alertService.getAlertStats(parentId, childId as string);

  sendSuccess(res, stats);
});

export default {
  getAlertById,
  acknowledgeAlert,
  resolveAlert,
  getAlerts,
  getPendingCount,
  updateAlertStatus,
  getAlertStats,
};
