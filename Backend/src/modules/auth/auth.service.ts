import { authRepository } from './auth.repository';
import { generateTokenPair, verifyRefreshToken, TokenPair } from './token.utils';
import { IUser } from '../users/user.model';
import { UserRole, ERROR_MESSAGES } from '../../config/constants';
import {
  AuthenticationError,
  ConflictError,
  NotFoundError,
  AuthorizationError,
} from '../../utils/errors';
import { logger } from '../../utils/logger';

/**
 * Auth Service
 * Business logic for authentication operations
 */

export interface RegisterParentDTO {
  email: string;
  username?: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  consentGiven?: boolean;
}

export interface CreateChildDTO {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
}

export interface LoginDTO {
  login?: string;
  email?: string;
  username?: string;
  password: string;
}

export interface AuthResponse {
  user: Partial<IUser>;
  tokens: TokenPair;
}

export class AuthService {
  /**
   * Register a new parent account
   */
  async registerParent(data: RegisterParentDTO): Promise<AuthResponse> {
    logger.info(`Attempting to register parent: ${data.email}`);

    // Check for existing email
    if (await authRepository.emailExists(data.email)) {
      throw new ConflictError(ERROR_MESSAGES.EMAIL_EXISTS);
    }

    // Generate username from email if not provided
    const username = data.username || data.email.split('@')[0];

    // Check for existing username
    if (await authRepository.usernameExists(username)) {
      // If auto-generated username exists, append random suffix
      const uniqueUsername = `${username}_${Math.random().toString(36).substring(7)}`;
      if (await authRepository.usernameExists(uniqueUsername)) {
        throw new ConflictError(ERROR_MESSAGES.USERNAME_EXISTS);
      }
      data.username = uniqueUsername;
    } else {
      data.username = username;
    }

    // Sanitize phone number - remove spaces, hyphens, parentheses
    const sanitizedPhone = data.phone ? data.phone.replace(/[\s\-()]/g, '') : undefined;

    // Create parent user
    const user = await authRepository.createParent({
      email: data.email,
      username: data.username,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: sanitizedPhone,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      consentGiven: data.consentGiven ?? true,
    });

    // Generate tokens
    const tokens = generateTokenPair(user._id.toString(), user.role);

    // Save refresh token
    await authRepository.saveRefreshToken(user._id.toString(), tokens.refreshToken);

    logger.info(`Parent registered successfully: ${user._id}`);

    return {
      user: user.toPublicJSON(),
      tokens,
    };
  }

  /**
   * Create a child account (by parent)
   */
  async createChild(parentId: string, data: CreateChildDTO): Promise<{ user: Partial<IUser> }> {
    logger.info(`Parent ${parentId} creating child account`);

    // Check for existing username
    if (await authRepository.usernameExists(data.username)) {
      throw new ConflictError(ERROR_MESSAGES.USERNAME_EXISTS);
    }

    // Create child linked to parent
    const child = await authRepository.createChild(parentId, {
      username: data.username,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
    });

    logger.info(`Child account created: ${child._id} for parent: ${parentId}`);

    return {
      user: child.toPublicJSON(),
    };
  }

  /**
   * Login user (parent or child)
   */
  async login(data: LoginDTO): Promise<AuthResponse> {
    const loginIdentifier = data.login || data.email || data.username!;
    logger.info(`Login attempt for: ${loginIdentifier}`);

    // Find user by email or username
    const user = await authRepository.findByEmailOrUsername(loginIdentifier);

    if (!user) {
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(data.password);

    if (!isPasswordValid) {
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AuthorizationError('Account is deactivated');
    }

    // Generate tokens
    const tokens = generateTokenPair(user._id.toString(), user.role);

    // Save refresh token and update last login
    await Promise.all([
      authRepository.saveRefreshToken(user._id.toString(), tokens.refreshToken),
      authRepository.updateLastLogin(user._id.toString()),
    ]);

    logger.info(`User logged in: ${user._id}`);

    return {
      user: user.toPublicJSON(),
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      // Verify the refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Check if token exists in user's tokens (for revocation)
      const hasToken = await authRepository.hasRefreshToken(payload.userId, refreshToken);

      if (!hasToken) {
        throw new AuthenticationError(ERROR_MESSAGES.REFRESH_TOKEN_INVALID);
      }

      // Get user
      const user = await authRepository.findById(payload.userId);

      if (!user || !user.isActive) {
        throw new AuthenticationError(ERROR_MESSAGES.REFRESH_TOKEN_INVALID);
      }

      // Remove old refresh token
      await authRepository.removeRefreshToken(payload.userId, refreshToken);

      // Generate new token pair (rotation)
      const tokens = generateTokenPair(user._id.toString(), user.role);

      // Save new refresh token
      await authRepository.saveRefreshToken(user._id.toString(), tokens.refreshToken);

      logger.info(`Token refreshed for user: ${user._id}`);

      return tokens;
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError(ERROR_MESSAGES.REFRESH_TOKEN_INVALID);
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Remove specific refresh token
      await authRepository.removeRefreshToken(userId, refreshToken);
    } else {
      // Remove all refresh tokens (logout from all devices)
      await authRepository.removeAllRefreshTokens(userId);
    }

    logger.info(`User logged out: ${userId}`);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUser> {
    const user = await authRepository.findById(userId);

    if (!user) {
      throw new NotFoundError('User');
    }

    return user;
  }

  /**
   * Block child from updating credentials
   * SECURITY: Child accounts cannot modify their own credentials
   */
  validateCredentialUpdate(userRole: UserRole): void {
    if (userRole === UserRole.CHILD) {
      throw new AuthorizationError(ERROR_MESSAGES.CHILD_CANNOT_UPDATE_CREDENTIALS);
    }
  }
}

export const authService = new AuthService();
export default authService;
