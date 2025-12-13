import mongoose from 'mongoose';
import { User, IUser } from '../users/user.model';
import { UserRole } from '../../config/constants';

/**
 * Auth Repository
 * Data access layer for authentication-related operations
 */
export class AuthRepository {
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).select('+password');
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<IUser | null> {
    return User.findOne({ username }).select('+password');
  }

  /**
   * Find user by email or username
   */
  async findByEmailOrUsername(login: string): Promise<IUser | null> {
    return User.findOne({
      $or: [
        { email: login.toLowerCase() },
        { username: login },
      ],
    }).select('+password');
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  /**
   * Find user by ID with password
   */
  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return User.findById(id).select('+password +refreshTokens');
  }

  /**
   * Create parent user
   */
  async createParent(userData: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: Date;
    consentGiven: boolean;
  }): Promise<IUser> {
    const user = new User({
      ...userData,
      role: UserRole.PARENT,
      consentDate: userData.consentGiven ? new Date() : undefined,
      isVerified: false,
      children: [],
    });

    return user.save();
  }

  /**
   * Create child user linked to parent
   */
  async createChild(
    parentId: string,
    childData: {
      username: string;
      password: string;
      firstName: string;
      lastName: string;
      dateOfBirth?: Date;
    }
  ): Promise<IUser> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const child = new User({
        ...childData,
        role: UserRole.CHILD,
        parentId: new mongoose.Types.ObjectId(parentId),
        parentalConsent: true,
        consentGiven: true,
        consentDate: new Date(),
        isVerified: true,
      });

      await child.save({ session });

      // Add child to parent's children array
      await User.findByIdAndUpdate(
        parentId,
        { $push: { children: child._id } },
        { session }
      );

      await session.commitTransaction();
      return child;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { lastLoginAt: new Date() });
  }

  /**
   * Save refresh token for user
   */
  async saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $push: { refreshTokens: refreshToken },
    });
  }

  /**
   * Remove specific refresh token
   */
  async removeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: refreshToken },
    });
  }

  /**
   * Remove all refresh tokens for user
   */
  async removeAllRefreshTokens(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshTokens: [] });
  }

  /**
   * Check if refresh token exists for user
   */
  async hasRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const user = await User.findById(userId).select('+refreshTokens');
    return user?.refreshTokens?.includes(refreshToken) ?? false;
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await User.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    const count = await User.countDocuments({ username });
    return count > 0;
  }
}

export const authRepository = new AuthRepository();
export default authRepository;
