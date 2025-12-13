import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { TokenType, UserRole } from '../../config/constants';

/**
 * JWT Token Utilities
 * Handles token generation, verification, and refresh token rotation
 */

export interface TokenPayload {
  userId: string;
  role: UserRole;
  type: TokenType;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Generate access token
 */
export function generateAccessToken(userId: string, role: UserRole): string {
  const payload: TokenPayload = {
    userId,
    role,
    type: TokenType.ACCESS,
  };

  const options: SignOptions = {
    expiresIn: env.jwt.accessExpiresIn as string,
    algorithm: 'HS256',
  };

  return jwt.sign(payload, env.jwt.accessSecret, options);
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(userId: string, role: UserRole): string {
  const payload: TokenPayload = {
    userId,
    role,
    type: TokenType.REFRESH,
  };

  const options: SignOptions = {
    expiresIn: env.jwt.refreshExpiresIn as string,
    algorithm: 'HS256',
  };

  return jwt.sign(payload, env.jwt.refreshSecret, options);
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(userId: string, role: UserRole): TokenPair {
  return {
    accessToken: generateAccessToken(userId, role),
    refreshToken: generateRefreshToken(userId, role),
    expiresIn: env.jwt.accessExpiresIn,
  };
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): TokenPayload {
  const payload = jwt.verify(token, env.jwt.accessSecret) as TokenPayload;
  
  if (payload.type !== TokenType.ACCESS) {
    throw new Error('Invalid token type');
  }
  
  return payload;
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  const payload = jwt.verify(token, env.jwt.refreshSecret) as TokenPayload;
  
  if (payload.type !== TokenType.REFRESH) {
    throw new Error('Invalid token type');
  }
  
  return payload;
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}

export default {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
};
