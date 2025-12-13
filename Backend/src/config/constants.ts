/**
 * Application Constants
 * Centralized location for all constant values used throughout the application
 */

/**
 * User Roles - Defines the access levels in the system
 * PRIVACY NOTE: Role-based access control is enforced to ensure proper data isolation
 */
export enum UserRole {
  PARENT = 'parent',
  CHILD = 'child',
  ADMIN = 'admin',
}

/**
 * Alert Severity Levels
 * Used for categorizing cyberbullying incidents
 */
export enum AlertSeverity {
  LOW = 'low',       // Guidance provided
  MEDIUM = 'medium', // Warning issued
  HIGH = 'high',     // Parent notification triggered
  CRITICAL = 'critical', // Emergency escalation
}

/**
 * Scan Types - Types of content that can be analyzed
 */
export enum ScanType {
  TEXT = 'text',
  SCREEN_METADATA = 'screen_metadata',
  IMAGE = 'image',
}

/**
 * Abuse Categories - Types of cyberbullying detected by AI
 */
export enum AbuseCategory {
  HARASSMENT = 'harassment',
  THREAT = 'threat',
  HATE_SPEECH = 'hate_speech',
  SEXUAL_CONTENT = 'sexual_content',
  SELF_HARM = 'self_harm',
  BULLYING = 'bullying',
  DISCRIMINATION = 'discrimination',
  PROFANITY = 'profanity',
  SPAM = 'spam',
  OTHER = 'other',
}

/**
 * Alert Status
 */
export enum AlertStatus {
  PENDING = 'pending',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
}

/**
 * Audit Action Types - For compliance logging
 */
export enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE_CHILD = 'create_child',
  VIEW_SCAN_HISTORY = 'view_scan_history',
  VIEW_ALERTS = 'view_alerts',
  UPDATE_SETTINGS = 'update_settings',
  SCAN_CONTENT = 'scan_content',
  MANUAL_REPORT = 'manual_report',
  ACCESS_RESOURCES = 'access_resources',
  ADMIN_ACTION = 'admin_action',
}

/**
 * Token Types
 */
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}

/**
 * HTTP Status Codes - Commonly used status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'Authentication required',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  REFRESH_TOKEN_INVALID: 'Invalid refresh token',
  
  // Authorization
  FORBIDDEN: 'You do not have permission to perform this action',
  ROLE_REQUIRED: 'Insufficient role permissions',
  CHILD_CANNOT_UPDATE_CREDENTIALS: 'Child accounts cannot modify credentials',
  
  // Validation
  VALIDATION_ERROR: 'Validation failed',
  INVALID_INPUT: 'Invalid input provided',
  
  // Resources
  USER_NOT_FOUND: 'User not found',
  CHILD_NOT_FOUND: 'Child account not found',
  SCAN_NOT_FOUND: 'Scan result not found',
  ALERT_NOT_FOUND: 'Alert not found',
  
  // Conflicts
  EMAIL_EXISTS: 'Email already registered',
  USERNAME_EXISTS: 'Username already taken',
  
  // Server
  INTERNAL_ERROR: 'An internal error occurred',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  AI_SERVICE_ERROR: 'AI analysis service error',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  REGISTERED: 'Registration successful',
  LOGGED_IN: 'Login successful',
  LOGGED_OUT: 'Logout successful',
  TOKEN_REFRESHED: 'Token refreshed successfully',
  CHILD_CREATED: 'Child account created successfully',
  SCAN_COMPLETED: 'Content scan completed',
  SETTINGS_UPDATED: 'Settings updated successfully',
  ALERT_ACKNOWLEDGED: 'Alert acknowledged',
} as const;

/**
 * Pagination Defaults
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * Severity Score Thresholds
 * Used to categorize AI severity scores into alert levels
 */
export const SEVERITY_THRESHOLDS = {
  LOW: 30,      // 0-30: Low severity
  MEDIUM: 60,   // 31-60: Medium severity
  HIGH: 85,     // 61-85: High severity
  CRITICAL: 100, // 86-100: Critical severity
} as const;

/**
 * Socket Events
 */
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // Alerts
  NEW_ALERT: 'alert:new',
  ALERT_UPDATED: 'alert:updated',
  ALERT_ACKNOWLEDGED: 'alert:acknowledged',
  
  // Scans
  SCAN_RESULT: 'scan:result',
  
  // Parent notifications
  CHILD_ALERT: 'parent:child_alert',
  HIGH_SEVERITY_ALERT: 'parent:high_severity',
  
  // System
  ERROR: 'error',
  AUTHENTICATED: 'authenticated',
} as const;
