import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../modules/auth/token.utils';
import { UserRole, ERROR_MESSAGES, HTTP_STATUS } from '../config/constants';
import { AuthenticationError, AuthorizationError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Extended Request with authenticated user data
 */
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Authentication Middleware
 * Verifies JWT access token and attaches user data to request
 */
export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AuthenticationError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const payload = verifyAccessToken(token);
    req.user = payload;

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else {
      logger.error('Authentication error:', error);
      next(new AuthenticationError(ERROR_MESSAGES.TOKEN_INVALID));
    }
  }
};

/**
 * Role-based Authorization Middleware
 * Restricts access to specific user roles
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError(ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError(ERROR_MESSAGES.ROLE_REQUIRED);
    }

    next();
  };
};

/**
 * Block child credential updates
 * Special middleware to enforce that children cannot update their credentials
 */
export const blockChildCredentialUpdate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (req.user?.role === UserRole.CHILD) {
    throw new AuthorizationError(ERROR_MESSAGES.CHILD_CANNOT_UPDATE_CREDENTIALS);
  }
  next();
};

/**
 * Optional authentication
 * Attaches user if token provided, but doesn't require it
 */
export const optionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const payload = verifyAccessToken(token);
        req.user = payload;
      }
    }

    next();
  } catch {
    // Token invalid, continue without user
    next();
  }
};

export default {
  authenticate,
  requireRole,
  blockChildCredentialUpdate,
  optionalAuth,
};
