import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { userService } from './index';
import { sendSuccess } from '../../utils/response';
import { UserRole, HTTP_STATUS } from '../../config/constants';

const router = Router();

/**
 * User Routes
 * Profile management endpoints
 */

/**
 * Get current user profile
 * GET /users/profile
 */
router.get('/profile', authenticate as any, async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user!.userId;
    const user = await userService.getUserById(userId);

    sendSuccess(res, user.toPublicJSON(), 'Profile retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * Update current user profile
 * PUT /users/profile
 */
router.put('/profile', authenticate as any, async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user!.userId;
    const { firstName, lastName, dateOfBirth } = req.body;

    const user = await userService.updateProfile(
      userId,
      userId,
      (req as any).user!.role,
      { firstName, lastName, dateOfBirth }
    );

    sendSuccess(res, user.toPublicJSON(), 'Profile updated');
  } catch (error) {
    next(error);
  }
});

/**
 * Get user by ID (admin or self)
 * GET /users/:id
 */
router.get('/:id', authenticate as any, async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requestingUserId = (req as any).user!.userId;
    const requestingUserRole = (req as any).user!.role;
    const { id } = req.params;

    // Only allow accessing own profile or admin access
    if (id !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    const user = await userService.getUserById(id);
    sendSuccess(res, user.toPublicJSON(), 'User retrieved');
  } catch (error) {
    next(error);
  }
});

/**
 * Deactivate account
 * DELETE /users/account
 */
router.delete('/account', authenticate as any, async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user!.userId;
    const role = (req as any).user!.role;

    await userService.deactivateUser(userId, userId, role);

    sendSuccess(res, null, 'Account deactivated');
  } catch (error) {
    next(error);
  }
});

export default router;
