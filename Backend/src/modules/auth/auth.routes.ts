import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { validate } from '../../validations';
import {
  registerParentSchema,
  createChildSchema,
  loginSchema,
  refreshTokenSchema,
} from '../../validations/schemas';
import { UserRole } from '../../config/constants';
import { authRateLimiter } from '../../middlewares/rateLimiter.middleware';

const router = Router();

/**
 * Auth Routes
 * All authentication-related endpoints
 */

// Public routes (with rate limiting)
router.post(
  '/register-parent',
  authRateLimiter,
  validate(registerParentSchema),
  authController.registerParent
);

// Alias for compatibility
router.post(
  '/register',
  authRateLimiter,
  validate(registerParentSchema),
  authController.registerParent
);

router.post(
  '/login',
  authRateLimiter,
  validate(loginSchema),
  authController.login
);

router.post(
  '/refresh',
  authRateLimiter,
  validate(refreshTokenSchema),
  authController.refreshToken
);

// Alias for compatibility
router.post(
  '/refresh-token',
  authRateLimiter,
  validate(refreshTokenSchema),
  authController.refreshToken
);

// Protected routes
router.post(
  '/create-child',
  authenticate,
  requireRole([UserRole.PARENT]),
  validate(createChildSchema),
  authController.createChild
);

// Alias for compatibility
router.post(
  '/child',
  authenticate,
  requireRole([UserRole.PARENT]),
  validate(createChildSchema),
  authController.createChild
);

router.post(
  '/logout',
  authenticate,
  authController.logout
);

router.get(
  '/me',
  authenticate,
  authController.getMe
);

export default router;
