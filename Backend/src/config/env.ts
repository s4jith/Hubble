import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Environment Configuration
 * Centralized configuration management for the application
 * All sensitive data is loaded from environment variables
 */
export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',

  // MongoDB Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/hubble_db',
  },

  // JWT Configuration
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default-access-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // AI Service Configuration
  ai: {
    serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:5000/api/analyze',
    apiKey: process.env.AI_SERVICE_API_KEY || '',
    mockEnabled: process.env.AI_SERVICE_MOCK === 'true',
    // Gemini API Keys (multiple keys for rotation)
    geminiApiKeys: process.env.GEMINI_API_KEYS
      ? process.env.GEMINI_API_KEYS.split(',').map(k => k.trim())
      : [],
  },

  // Socket.IO
  socket: {
    corsOrigin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3001',
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'debug',

  // Security
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
} as const;

/**
 * Validate required environment variables
 * Throws error if critical variables are missing in production
 */
export function validateEnv(): void {
  const requiredVars = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'MONGODB_URI',
  ];

  if (env.nodeEnv === 'production') {
    const missing = requiredVars.filter((varName) => !process.env[varName]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Warn if using default secrets in production
    if (env.jwt.accessSecret === 'default-access-secret') {
      throw new Error('JWT_ACCESS_SECRET must be set in production');
    }
  }
}

export default env;
