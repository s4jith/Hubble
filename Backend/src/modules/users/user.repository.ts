import { User, IUser } from './user.model';
import { UserRole } from '../../config/constants';
import mongoose from 'mongoose';

/**
 * User Repository
 * Data access layer for user operations
 */
export class UserRepository {
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  /**
   * Find users by role
   */
  async findByRole(role: UserRole, page: number = 1, limit: number = 20): Promise<{
    users: IUser[];
    total: number;
  }> {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find({ role }).skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments({ role }),
    ]);

    return { users, total };
  }

  /**
   * Find all children for a parent
   */
  async findChildrenByParentId(parentId: string): Promise<IUser[]> {
    return User.find({ parentId: new mongoose.Types.ObjectId(parentId), role: UserRole.CHILD });
  }

  /**
   * Find parent by child ID
   */
  async findParentByChildId(childId: string): Promise<IUser | null> {
    const child = await User.findById(childId);
    if (!child || !child.parentId) {
      return null;
    }
    return User.findById(child.parentId);
  }

  /**
   * Update user
   */
  async updateUser(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
  }

  /**
   * Deactivate user
   */
  async deactivateUser(id: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { isActive: false }, { new: true });
  }

  /**
   * Activate user
   */
  async activateUser(id: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { isActive: true }, { new: true });
  }

  /**
   * Delete user (soft delete by deactivating)
   */
  async deleteUser(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, { isActive: false });
  }

  /**
   * Get user count by role
   */
  async getCountByRole(role: UserRole): Promise<number> {
    return User.countDocuments({ role, isActive: true });
  }

  /**
   * Get all users (admin)
   */
  async findAll(
    page: number = 1,
    limit: number = 20,
    filters: { role?: UserRole; isActive?: boolean } = {}
  ): Promise<{ users: IUser[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};

    if (filters.role) {
      query.role = filters.role;
    }
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    return { users, total };
  }
}

export const userRepository = new UserRepository();
export default userRepository;
