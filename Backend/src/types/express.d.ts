import { UserRole } from '../config/constants';

/**
 * Type Definitions
 * Custom TypeScript type declarations
 */

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
        type: string;
      };
    }
  }
}

export {};
