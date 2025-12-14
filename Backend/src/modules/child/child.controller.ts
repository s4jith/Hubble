import { Response } from 'express';
import { childService } from './child.service';
import { asyncHandler, sendSuccess, sendPaginated } from '../../utils';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { SUCCESS_MESSAGES } from '../../config/constants';
import { parsePagination } from '../../utils/helpers';

/**
 * Child Controller
 * Handles HTTP requests for child-specific endpoints
 */

/**
 * @swagger
 * /child/scans:
 *   get:
 *     summary: Get scan history for the authenticated child
 *     tags: [Child]
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
 *     responses:
 *       200:
 *         description: Scan history
 */
export const getScanHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const childId = req.user!.userId;
  const { page, limit } = parsePagination(req.query.page as string, req.query.limit as string);

  const result = await childService.getScanHistory(childId, page, limit);

  sendPaginated(res, result.scans, result.page, result.limit, result.total);
});

/**
 * @swagger
 * /child/alerts:
 *   get:
 *     summary: Get alerts for the authenticated child
 *     tags: [Child]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of alerts
 */
export const getAlerts = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const childId = req.user!.userId;
  const { page, limit } = parsePagination(req.query.page as string, req.query.limit as string);

  const result = await childService.getAlerts(childId, page, limit);

  sendPaginated(res, result.alerts, result.page, result.limit, result.total);
});

/**
 * @swagger
 * /child/alerts/{alertId}/acknowledge:
 *   post:
 *     summary: Acknowledge an alert
 *     tags: [Child]
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
  const childId = req.user!.userId;
  const { alertId } = req.params;

  const alert = await childService.acknowledgeAlert(childId, alertId);

  sendSuccess(res, { alert }, SUCCESS_MESSAGES.ALERT_ACKNOWLEDGED);
});

/**
 * @swagger
 * /child/resources:
 *   get:
 *     summary: Get mental health resources
 *     tags: [Child]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: severityScore
 *         schema:
 *           type: number
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *           description: Comma-separated list of categories
 *     responses:
 *       200:
 *         description: List of resources
 */
export const getResources = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const childId = req.user!.userId;
  const { severityScore, categories } = req.query;

  const parsedCategories = categories
    ? (categories as string).split(',').map((c) => c.trim())
    : undefined;

  const resources = await childService.getResources(
    childId,
    severityScore ? parseInt(severityScore as string, 10) : undefined,
    parsedCategories
  );

  sendSuccess(res, { resources });
});

/**
 * @swagger
 * /child/resources/emergency:
 *   get:
 *     summary: Get emergency resources
 *     tags: [Child]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Emergency resources
 */
export const getEmergencyResources = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const resources = await childService.getEmergencyResources();

  sendSuccess(res, { resources });
});

/**
 * @swagger
 * /child/report:
 *   post:
 *     summary: Submit a manual abuse report
 *     tags: [Child]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - description
 *             properties:
 *               content:
 *                 type: string
 *               description:
 *                 type: string
 *               sourceApp:
 *                 type: string
 *     responses:
 *       201:
 *         description: Report submitted
 */
export const submitReport = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const childId = req.user!.userId;

  const scanResult = await childService.submitManualReport(childId, req.body);

  sendSuccess(res, { scanResult }, 'Report submitted successfully');
});

/**
 * @swagger
 * /child/profile:
 *   get:
 *     summary: Get child profile
 *     tags: [Child]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Child profile
 */
export const getProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const childId = req.user!.userId;

  const profile = await childService.getProfile(childId);

  sendSuccess(res, profile);
});

/**
 * @swagger
 * /child/profile:
 *   put:
 *     summary: Update child profile (non-credential fields only)
 *     tags: [Child]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
export const updateProfile = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const childId = req.user!.userId;

  // Block credential updates
  const blockedFields = ['username', 'email', 'password', 'role', 'parentId'];
  const hasBlockedField = Object.keys(req.body).some((key) => blockedFields.includes(key));

  if (hasBlockedField) {
    res.status(403).json({
      success: false,
      message: 'Children cannot update credentials. Contact your parent.',
    });
    return;
  }

  const profile = await childService.updateProfile(childId, req.body);

  sendSuccess(res, profile, 'Profile updated successfully');
});

export default {
  getProfile,
  updateProfile,
  getScanHistory,
  getAlerts,
  acknowledgeAlert,
  getResources,
  getEmergencyResources,
  submitReport,
};
