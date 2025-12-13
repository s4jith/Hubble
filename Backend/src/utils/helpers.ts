import { SEVERITY_THRESHOLDS, AlertSeverity } from '../config/constants';

/**
 * Utility Helpers
 * Common helper functions used throughout the application
 */

/**
 * Convert severity score to severity level
 */
export function scoreToSeverity(score: number): AlertSeverity {
  if (score <= SEVERITY_THRESHOLDS.LOW) {
    return AlertSeverity.LOW;
  }
  if (score <= SEVERITY_THRESHOLDS.MEDIUM) {
    return AlertSeverity.MEDIUM;
  }
  if (score <= SEVERITY_THRESHOLDS.HIGH) {
    return AlertSeverity.HIGH;
  }
  return AlertSeverity.CRITICAL;
}

/**
 * Generate a random alphanumeric string
 */
export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Sanitize string for safe logging/display
 */
export function sanitizeString(str: string): string {
  return str.replace(/[<>'"&]/g, (char) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
      '&': '&amp;',
    };
    return entities[char] || char;
  });
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Mask email for privacy
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}${local[1]}***@${domain}`;
}

/**
 * Parse pagination parameters
 */
export function parsePagination(
  page?: string | number,
  limit?: string | number,
  maxLimit: number = 100
): { page: number; limit: number; skip: number } {
  const parsedPage = Math.max(1, parseInt(String(page || 1), 10));
  const parsedLimit = Math.min(maxLimit, Math.max(1, parseInt(String(limit || 20), 10)));
  const skip = (parsedPage - 1) * parsedLimit;

  return { page: parsedPage, limit: parsedLimit, skip };
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Format date to ISO string without milliseconds
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('.')[0] + 'Z';
}
