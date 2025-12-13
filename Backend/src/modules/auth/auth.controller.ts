import { Request, Response } from 'express';
import { authService } from './auth.service';
import { asyncHandler, sendSuccess, sendCreated } from '../../utils';
import { SUCCESS_MESSAGES, HTTP_STATUS } from '../../config/constants';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';

/**
 * Auth Controller
 * Handles HTTP requests for authentication endpoints
 */

/**
 * @swagger
 * /auth/register-parent:
 *   post:
 *     summary: Register a new parent account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterParentInput'
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email or username already exists
 */
export const registerParent = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerParent(req.body);

  sendCreated(res, {
    user: result.user,
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
  }, SUCCESS_MESSAGES.REGISTERED);
});

/**
 * @swagger
 * /auth/create-child:
 *   post:
 *     summary: Create a child account (parent only)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateChildInput'
 *     responses:
 *       201:
 *         description: Child account created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only parents can create child accounts
 *       409:
 *         description: Username already exists
 */
export const createChild = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const parentId = req.user!.userId;
  const result = await authService.createChild(parentId, req.body);

  sendCreated(res, result, SUCCESS_MESSAGES.CHILD_CREATED);
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user (parent or child)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);

  sendSuccess(res, {
    user: result.user,
    accessToken: result.tokens.accessToken,
    refreshToken: result.tokens.refreshToken,
  }, SUCCESS_MESSAGES.LOGGED_IN);
});

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Invalid refresh token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  const tokens = await authService.refreshToken(refreshToken);

  sendSuccess(res, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  }, SUCCESS_MESSAGES.TOKEN_REFRESHED);
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Optional - if provided, only that token is revoked
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
export const logout = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { refreshToken } = req.body;

  await authService.logout(userId, refreshToken);

  sendSuccess(res, null, SUCCESS_MESSAGES.LOGGED_OUT);
});

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
export const getMe = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const user = await authService.getUserById(userId);

  sendSuccess(res, { user: user.toPublicJSON() });
});

export default {
  registerParent,
  createChild,
  login,
  refreshToken,
  logout,
  getMe,
};
