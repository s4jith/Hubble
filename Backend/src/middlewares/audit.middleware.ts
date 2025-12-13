import { Request, Response, NextFunction } from 'express';
import { AuditLog } from '../modules/users/auditLog.model';
import { AuditAction, UserRole } from '../config/constants';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from './auth.middleware';

/**
 * Audit Logging Middleware
 * Logs sensitive actions for compliance
 * 
 * PRIVACY & COMPLIANCE:
 * - All sensitive data access is logged
 * - Logs are immutable
 * - Used for security auditing
 */

interface AuditOptions {
  action: AuditAction;
  resourceType: string;
  getResourceId?: (req: Request) => string | undefined;
  getDescription?: (req: Request) => string;
}

/**
 * Create audit middleware for specific actions
 */
export const createAuditMiddleware = (options: AuditOptions) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    // Store original end function
    const originalEnd = res.end;
    const startTime = Date.now();

    // Override end to capture response
    res.end = function (this: Response, ...args: unknown[]): Response {
      // Restore original end
      res.end = originalEnd;
      
      // Create audit log after response
      setImmediate(async () => {
        try {
          if (req.user) {
            const success = res.statusCode >= 200 && res.statusCode < 400;

            await AuditLog.create({
              userId: req.user.userId,
              userRole: req.user.role as UserRole,
              username: req.user.userId, // Will be populated with actual username if needed
              action: options.action,
              resourceType: options.resourceType,
              resourceId: options.getResourceId?.(req),
              description: options.getDescription?.(req) ?? `${options.action} on ${options.resourceType}`,
              ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
              userAgent: req.get('User-Agent') || 'unknown',
              requestMethod: req.method,
              requestPath: req.path,
              metadata: {
                duration: Date.now() - startTime,
                statusCode: res.statusCode,
              },
              success,
              errorMessage: success ? undefined : 'Request failed',
            });
          }
        } catch (error) {
          logger.error('Failed to create audit log:', error);
        }
      });

      // Call original end
      return originalEnd.apply(this, args as [unknown?, BufferEncoding?, (() => void)?]);
    };

    next();
  };
};

/**
 * Pre-configured audit middlewares
 */
export const auditLogin = createAuditMiddleware({
  action: AuditAction.LOGIN,
  resourceType: 'auth',
  getDescription: () => 'User login attempt',
});

export const auditLogout = createAuditMiddleware({
  action: AuditAction.LOGOUT,
  resourceType: 'auth',
  getDescription: () => 'User logout',
});

export const auditCreateChild = createAuditMiddleware({
  action: AuditAction.CREATE_CHILD,
  resourceType: 'user',
  getDescription: (req) => `Created child account: ${req.body?.username}`,
});

export const auditViewScanHistory = createAuditMiddleware({
  action: AuditAction.VIEW_SCAN_HISTORY,
  resourceType: 'scan',
  getDescription: () => 'Viewed scan history',
});

export const auditViewAlerts = createAuditMiddleware({
  action: AuditAction.VIEW_ALERTS,
  resourceType: 'alert',
  getDescription: () => 'Viewed alerts',
});

export const auditUpdateSettings = createAuditMiddleware({
  action: AuditAction.UPDATE_SETTINGS,
  resourceType: 'settings',
  getDescription: () => 'Updated settings',
});

export const auditScanContent = createAuditMiddleware({
  action: AuditAction.SCAN_CONTENT,
  resourceType: 'scan',
  getDescription: (req) => `Scanned content from ${req.body?.sourceApp || 'unknown'}`,
});

export const auditManualReport = createAuditMiddleware({
  action: AuditAction.MANUAL_REPORT,
  resourceType: 'report',
  getDescription: () => 'Submitted manual report',
});

export const auditAccessResources = createAuditMiddleware({
  action: AuditAction.ACCESS_RESOURCES,
  resourceType: 'mental_health_resource',
  getDescription: () => 'Accessed mental health resources',
});

export default {
  createAuditMiddleware,
  auditLogin,
  auditLogout,
  auditCreateChild,
  auditViewScanHistory,
  auditViewAlerts,
  auditUpdateSettings,
  auditScanContent,
  auditManualReport,
  auditAccessResources,
};
