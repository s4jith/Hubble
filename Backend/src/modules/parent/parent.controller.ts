import { Response } from 'express';
import { parentService } from './parent.service';
import { asyncHandler, sendSuccess, sendPaginated } from '../../utils';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { SUCCESS_MESSAGES, AlertSeverity, AlertStatus } from '../../config/constants';
import { parsePagination } from '../../utils/helpers';

/**
 * Parent Controller
 * Handles HTTP requests for parent-specific endpoints
 */

/**
 * @swagger
 * /parent/children:
 *   get:
 *     summary: Get all children for the authenticated parent
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of children
 *       401:
 *         description: Unauthorized
 */
export const getChildren = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parentId = req.user!.userId;
  const children = await parentService.getChildren(parentId);

  sendSuccess(res, { children: children.map((c) => c.toPublicJSON()) });
});

/**
 * @swagger
 * /parent/children/{childId}:
 *   get:
 *     summary: Get specific child details
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Child details
 *       404:
 *         description: Child not found
 */
export const getChild = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parentId = req.user!.userId;
  const { childId } = req.params;
  const child = await parentService.getChild(parentId, childId);

  sendSuccess(res, { child: child.toPublicJSON() });
});

/**
 * @swagger
 * /parent/children/{childId}/scan-history:
 *   get:
 *     summary: Get scan history for a specific child
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Scan history for the child
 *       404:
 *         description: Child not found
 */
export const getChildScanHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parentId = req.user!.userId;
  const { childId } = req.params;
  const { page, limit } = parsePagination(req.query.page as string, req.query.limit as string);

  const result = await parentService.getChildScanHistory(parentId, childId, page, limit);

  sendPaginated(res, result.scans, result.page, result.limit, result.total);
});

/**
 * @swagger
 * /parent/incidents:
 *   get:
 *     summary: Get incidents for parent's children
 *     tags: [Parent]
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
 *         name: childId
 *         schema:
 *           type: string
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *     responses:
 *       200:
 *         description: List of incidents
 */
export const getIncidents = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parentId = req.user!.userId;
  const { page, limit } = parsePagination(req.query.page as string, req.query.limit as string);
  const { childId, severity, startDate, endDate } = req.query;

  const result = await parentService.getIncidents(parentId, page, limit, {
    childId: childId as string,
    severity: severity as AlertSeverity,
    startDate: startDate as string,
    endDate: endDate as string,
  });

  sendPaginated(res, result.incidents, result.page, result.limit, result.total);
});

/**
 * @swagger
 * /parent/alerts:
 *   get:
 *     summary: Get alerts for parent
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of alerts
 */
export const getAlerts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parentId = req.user!.userId;
  const { page, limit } = parsePagination(req.query.page as string, req.query.limit as string);
  const { status, severity, childId } = req.query;

  const result = await parentService.getAlerts(parentId, page, limit, {
    status: status as AlertStatus,
    severity: severity as AlertSeverity,
    childId: childId as string,
  });

  sendPaginated(res, result.alerts, result.page, result.limit, result.total);
});

/**
 * @swagger
 * /parent/analytics:
 *   get:
 *     summary: Get analytics dashboard data
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: Analytics data
 */
export const getAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parentId = req.user!.userId;
  const { startDate, endDate } = req.query;

  const analytics = await parentService.getAnalytics(
    parentId,
    startDate as string,
    endDate as string
  );

  sendSuccess(res, { analytics });
});

/**
 * @swagger
 * /parent/settings:
 *   get:
 *     summary: Get parent settings
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Parent settings
 */
export const getSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parentId = req.user!.userId;
  const settings = await parentService.getSettings(parentId);

  sendSuccess(res, { settings });
});

/**
 * @swagger
 * /parent/settings:
 *   patch:
 *     summary: Update parent settings
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSettingsInput'
 *     responses:
 *       200:
 *         description: Settings updated
 */
export const updateSettings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parentId = req.user!.userId;
  const settings = await parentService.updateSettings(parentId, req.body);

  sendSuccess(res, { settings }, SUCCESS_MESSAGES.SETTINGS_UPDATED);
});

/**
 * @swagger
 * /parent/dashboard:
 *   get:
 *     summary: Get dashboard summary
 *     tags: [Parent]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary
 */
export const getDashboard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parentId = req.user!.userId;
  const summary = await parentService.getDashboardSummary(parentId);

  sendSuccess(res, { summary });
});

export default {
  getChildren,
  getChild,
  getChildScanHistory,
  getIncidents,
  getAlerts,
  getAnalytics,
  getSettings,
  updateSettings,
  getDashboard,
};
