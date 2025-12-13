import { Response } from 'express';
import { scanService } from './scan.service';
import { asyncHandler, sendSuccess, sendCreated } from '../../utils';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { SUCCESS_MESSAGES } from '../../config/constants';

/**
 * Scan Controller
 * Handles HTTP requests for scan endpoints
 */

/**
 * @swagger
 * /scan/text:
 *   post:
 *     summary: Scan text content for cyberbullying
 *     tags: [Scan]
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
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 10000
 *               sourceApp:
 *                 type: string
 *     responses:
 *       201:
 *         description: Scan completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 scanResult:
 *                   $ref: '#/components/schemas/ScanResult'
 *                 analysis:
 *                   $ref: '#/components/schemas/AIAnalysis'
 *                 alertCreated:
 *                   type: boolean
 */
export const scanText = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { content, sourceApp } = req.body;

  const result = await scanService.scanText(userId, content, sourceApp);

  sendCreated(
    res,
    {
      scanResult: result.scanResult,
      analysis: result.aiAnalysis,
      alertCreated: result.alertCreated,
    },
    SUCCESS_MESSAGES.SCAN_COMPLETED
  );
});

/**
 * @swagger
 * /scan/screen-metadata:
 *   post:
 *     summary: Scan screen capture metadata
 *     tags: [Scan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - metadata
 *             properties:
 *               metadata:
 *                 type: string
 *               sourceApp:
 *                 type: string
 *     responses:
 *       201:
 *         description: Scan completed
 */
export const scanScreenMetadata = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { metadata, sourceApp } = req.body;

  const result = await scanService.scanScreenMetadata(userId, metadata, sourceApp);

  sendCreated(
    res,
    {
      scanResult: result.scanResult,
      analysis: result.aiAnalysis,
      alertCreated: result.alertCreated,
    },
    SUCCESS_MESSAGES.SCAN_COMPLETED
  );
});

/**
 * @swagger
 * /scan/{scanId}:
 *   get:
 *     summary: Get scan result by ID
 *     tags: [Scan]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scanId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Scan result
 *       404:
 *         description: Scan not found
 */
export const getScanById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { scanId } = req.params;

  const scan = await scanService.getScanById(scanId, userId);

  sendSuccess(res, { scan });
});

/**
 * @swagger
 * /scan/image:
 *   post:
 *     summary: Scan image for harmful content
 *     tags: [Scan]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - imageUrl
 *             properties:
 *               imageUrl:
 *                 type: string
 *               imageData:
 *                 type: string
 *               source:
 *                 type: string
 *     responses:
 *       201:
 *         description: Scan completed
 */
export const scanImage = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { imageUrl, imageData, source } = req.body;

  const result = await scanService.scanImage(userId, imageUrl || imageData, source);

  sendCreated(
    res,
    {
      id: result.scanResult._id,
      analysis: result.aiAnalysis,
      alertCreated: result.alertCreated,
    },
    SUCCESS_MESSAGES.SCAN_COMPLETED
  );
});

/**
 * @swagger
 * /scan/history:
 *   get:
 *     summary: Get scan history
 *     tags: [Scan]
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
  const userId = req.user!.userId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  const result = await scanService.getScanHistory(userId, page, limit);

  sendSuccess(res, {
    scans: result.scans,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      pages: Math.ceil(result.total / result.limit),
    },
  });
});

export default {
  scanText,
  scanImage,
  scanScreenMetadata,
  getScanHistory,
  getScanById,
};
