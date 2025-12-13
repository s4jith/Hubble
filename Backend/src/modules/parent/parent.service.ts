import { parentRepository } from './parent.repository';
import { IUser } from '../users/user.model';
import { IScanResult } from '../scan/scan.model';
import { IAlert } from '../alerts/alert.model';
import { ISettings } from './settings.model';
import { AlertSeverity, AlertStatus } from '../../config/constants';
import { NotFoundError, AuthorizationError } from '../../utils/errors';
import { logger } from '../../utils/logger';

/**
 * Parent Service
 * Business logic for parent-specific operations
 * 
 * PRIVACY & COMPLIANCE:
 * - All data access is logged for audit
 * - Parents can only view their own children's data
 * - Monitoring transparency ensured through settings
 */
export class ParentService {
  /**
   * Get all children for the authenticated parent
   */
  async getChildren(parentId: string): Promise<IUser[]> {
    logger.info(`Parent ${parentId} fetching children list`);
    return parentRepository.getChildren(parentId);
  }

  /**
   * Get specific child details
   */
  async getChild(parentId: string, childId: string): Promise<IUser> {
    const child = await parentRepository.getChildById(parentId, childId);

    if (!child) {
      throw new NotFoundError('Child');
    }

    return child;
  }

  /**
   * Get incidents for parent's children
   */
  async getIncidents(
    parentId: string,
    page: number = 1,
    limit: number = 20,
    filters: {
      childId?: string;
      severity?: AlertSeverity;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<{ incidents: IScanResult[]; total: number; page: number; limit: number }> {
    logger.info(`Parent ${parentId} fetching incidents`);

    // Validate childId belongs to parent
    if (filters.childId) {
      const child = await parentRepository.getChildById(parentId, filters.childId);
      if (!child) {
        throw new AuthorizationError('Cannot access this child');
      }
    }

    const result = await parentRepository.getIncidents(parentId, page, limit, {
      childId: filters.childId,
      severity: filters.severity,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    });

    return { ...result, page, limit };
  }

  /**
   * Get alerts for parent
   */
  async getAlerts(
    parentId: string,
    page: number = 1,
    limit: number = 20,
    filters: {
      status?: AlertStatus;
      severity?: AlertSeverity;
      childId?: string;
    } = {}
  ): Promise<{ alerts: IAlert[]; total: number; page: number; limit: number }> {
    logger.info(`Parent ${parentId} fetching alerts`);

    const result = await parentRepository.getAlerts(parentId, page, limit, filters);

    return { ...result, page, limit };
  }

  /**
   * Get analytics dashboard data
   */
  async getAnalytics(
    parentId: string,
    startDate?: string,
    endDate?: string
  ): Promise<{
    totalScans: number;
    abusiveScans: number;
    bySeverity: Record<AlertSeverity, number>;
    byCategory: Record<string, number>;
    byChild: { childId: string; childName: string; count: number }[];
    trend: { date: string; count: number }[];
  }> {
    logger.info(`Parent ${parentId} fetching analytics`);

    // Default to last 30 days if not specified
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    return parentRepository.getAnalytics(parentId, start, end);
  }

  /**
   * Get parent settings
   */
  async getSettings(parentId: string): Promise<ISettings> {
    return parentRepository.getSettings(parentId);
  }

  /**
   * Update parent settings
   */
  async updateSettings(
    parentId: string,
    updateData: {
      notifications?: Partial<ISettings['notifications']>;
      monitoring?: Partial<ISettings['monitoring']>;
      defaultAlertThreshold?: AlertSeverity;
      dataRetentionDays?: number;
    }
  ): Promise<ISettings> {
    logger.info(`Parent ${parentId} updating settings`);

    // Build update object
    const update: Record<string, unknown> = {};

    if (updateData.notifications) {
      Object.entries(updateData.notifications).forEach(([key, value]) => {
        update[`notifications.${key}`] = value;
      });
    }

    if (updateData.monitoring) {
      Object.entries(updateData.monitoring).forEach(([key, value]) => {
        update[`monitoring.${key}`] = value;
      });
    }

    if (updateData.defaultAlertThreshold) {
      update.defaultAlertThreshold = updateData.defaultAlertThreshold;
    }

    if (updateData.dataRetentionDays) {
      update.dataRetentionDays = updateData.dataRetentionDays;
    }

    return parentRepository.updateSettings(parentId, update as Partial<ISettings>);
  }

  /**
   * Get summary statistics for parent dashboard
   */
  async getDashboardSummary(parentId: string): Promise<{
    totalChildren: number;
    pendingAlerts: number;
    highSeverityAlerts: number;
    recentIncidents: number;
  }> {
    const children = await parentRepository.getChildren(parentId);
    const { alerts } = await parentRepository.getAlerts(parentId, 1, 1000, {
      status: AlertStatus.PENDING,
    });

    const highSeverityAlerts = alerts.filter(
      (a) => a.severity === AlertSeverity.HIGH || a.severity === AlertSeverity.CRITICAL
    ).length;

    // Get incidents from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const { total: recentIncidents } = await parentRepository.getIncidents(parentId, 1, 1, {
      startDate: oneDayAgo,
    });

    return {
      totalChildren: children.length,
      pendingAlerts: alerts.length,
      highSeverityAlerts,
      recentIncidents,
    };
  }
}

export const parentService = new ParentService();
export default parentService;
