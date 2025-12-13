import { userRepository } from './user.repository';
import { IUser } from './user.model';
import { UserRole } from '../../config/constants';
import { NotFoundError, AuthorizationError } from '../../utils/errors';
import { logger } from '../../utils/logger';

/**
 * User Service
 * Business logic for user operations
 */
export class UserService {
  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(
    page: number,
    limit: number,
    filters: { role?: UserRole; isActive?: boolean }
  ): Promise<{ users: IUser[]; total: number }> {
    return userRepository.findAll(page, limit, filters);
  }

  /**
   * Update user profile
   * SECURITY: Child accounts cannot update certain fields
   */
  async updateProfile(
    userId: string,
    requestingUserId: string,
    requestingUserRole: UserRole,
    updateData: { firstName?: string; lastName?: string; dateOfBirth?: string }
  ): Promise<IUser> {
    const user = await this.getUserById(userId);

    // Check authorization
    if (requestingUserRole !== UserRole.ADMIN) {
      if (requestingUserId !== userId) {
        // Parents can update their children's profiles
        if (requestingUserRole === UserRole.PARENT && user.parentId?.toString() !== requestingUserId) {
          throw new AuthorizationError('Cannot update this user');
        }
        // Children cannot update others
        if (requestingUserRole === UserRole.CHILD) {
          throw new AuthorizationError('Cannot update other users');
        }
      }
    }

    const updatedUser = await userRepository.updateUser(userId, {
      firstName: updateData.firstName,
      lastName: updateData.lastName,
      dateOfBirth: updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : undefined,
    });

    if (!updatedUser) {
      throw new NotFoundError('User');
    }

    logger.info(`User profile updated: ${userId}`);
    return updatedUser;
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string, requestingUserId: string, requestingUserRole: UserRole): Promise<void> {
    const user = await this.getUserById(userId);

    // Only admin or the user themselves (if parent) can deactivate
    if (requestingUserRole !== UserRole.ADMIN) {
      if (requestingUserId !== userId && user.parentId?.toString() !== requestingUserId) {
        throw new AuthorizationError('Cannot deactivate this user');
      }
    }

    await userRepository.deactivateUser(userId);
    logger.info(`User deactivated: ${userId} by ${requestingUserId}`);
  }

  /**
   * Get user statistics (admin)
   */
  async getUserStats(): Promise<{
    totalParents: number;
    totalChildren: number;
    totalAdmins: number;
  }> {
    const [totalParents, totalChildren, totalAdmins] = await Promise.all([
      userRepository.getCountByRole(UserRole.PARENT),
      userRepository.getCountByRole(UserRole.CHILD),
      userRepository.getCountByRole(UserRole.ADMIN),
    ]);

    return { totalParents, totalChildren, totalAdmins };
  }
}

export const userService = new UserService();
export default userService;
