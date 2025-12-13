import { alertRepository } from './alert.repository';
import { parentRepository } from '../parent/parent.repository';
import { IAlert } from './alert.model';
import { AlertSeverity, AlertStatus, AbuseCategory } from '../../config/constants';
import { NotFoundError, AuthorizationError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { socketService } from '../../sockets/socket.service';

/**
 * Alert Service
 * Business logic for alert operations
 * Handles severity-based alerting and notifications
 */
export class AlertService {
  /**
   * Create alert from scan result
   */
  async createAlert(data: {
    childId: string;
    parentId: string;
    scanResultId: string;
    severity: AlertSeverity;
    categories: AbuseCategory[];
    severityScore: number;
  }): Promise<IAlert> {
    logger.info(`Creating alert for child ${data.childId}`, { severity: data.severity });

    // Generate alert title and message based on severity and categories
    const { title, message, guidance } = this.generateAlertContent(
      data.severity,
      data.categories,
      data.severityScore
    );

    // Create alert
    const alert = await alertRepository.createAlert({
      childId: data.childId,
      parentId: data.parentId,
      scanResultId: data.scanResultId,
      title,
      message,
      severity: data.severity,
      categories: data.categories,
      severityScore: data.severityScore,
      guidanceProvided: guidance,
    });

    // Handle severity-based notifications
    await this.handleSeverityBasedNotifications(alert, data.parentId);

    return alert;
  }

  /**
   * Generate alert content based on severity and categories
   */
  private generateAlertContent(
    severity: AlertSeverity,
    categories: AbuseCategory[],
    severityScore: number
  ): { title: string; message: string; guidance: string } {
    const categoryText = categories.length > 0
      ? categories.join(', ')
      : 'potentially harmful content';

    let title: string;
    let message: string;
    let guidance: string;

    switch (severity) {
      case AlertSeverity.LOW:
        title = 'Mild Concern Detected';
        message = `Content flagged for: ${categoryText}. Score: ${severityScore}/100.`;
        guidance = 'This content contains some concerning elements. Consider talking about online safety and respectful communication.';
        break;

      case AlertSeverity.MEDIUM:
        title = 'Moderate Concern Detected';
        message = `Concerning content detected: ${categoryText}. Score: ${severityScore}/100.`;
        guidance = 'This content shows signs of potential cyberbullying. We recommend discussing this with your child and monitoring the situation.';
        break;

      case AlertSeverity.HIGH:
        title = '⚠️ High Severity Alert';
        message = `Serious concern detected: ${categoryText}. Score: ${severityScore}/100.`;
        guidance = 'This content is highly concerning. Immediate discussion with your child is recommended. Consider reaching out to school counselors or authorities if needed.';
        break;

      case AlertSeverity.CRITICAL:
        title = '🚨 CRITICAL ALERT - Immediate Action Required';
        message = `Critical content detected: ${categoryText}. Score: ${severityScore}/100.`;
        guidance = 'This content requires immediate attention. If there are any threats of violence or self-harm, please contact emergency services or a crisis helpline immediately.';
        break;

      default:
        title = 'Alert';
        message = `Content flagged: ${categoryText}`;
        guidance = 'Please review this alert.';
    }

    return { title, message, guidance };
  }

  /**
   * Handle severity-based notifications
   */
  private async handleSeverityBasedNotifications(
    alert: IAlert,
    parentId: string
  ): Promise<void> {
    // Get parent settings
    const settings = await parentRepository.getSettings(parentId);

    // Check if parent should be notified based on their preferences
    let shouldNotifyParent = false;

    switch (alert.severity) {
      case AlertSeverity.LOW:
        shouldNotifyParent = settings.notifications.notifyOnLow;
        break;
      case AlertSeverity.MEDIUM:
        shouldNotifyParent = settings.notifications.notifyOnMedium;
        break;
      case AlertSeverity.HIGH:
        shouldNotifyParent = settings.notifications.notifyOnHigh;
        break;
      case AlertSeverity.CRITICAL:
        shouldNotifyParent = settings.notifications.notifyOnCritical;
        break;
    }

    // Always notify for high and critical if notifications are enabled
    if (alert.severity === AlertSeverity.HIGH || alert.severity === AlertSeverity.CRITICAL) {
      shouldNotifyParent = true;
    }

    // Send real-time notifications
    if (shouldNotifyParent) {
      // Notify parent via Socket.IO
      socketService.notifyParent(parentId, alert);
      await alertRepository.markParentNotified(alert._id.toString());
    }

    // Always notify child with guidance
    socketService.notifyChild(alert.childId.toString(), alert);
    await alertRepository.markChildNotified(alert._id.toString());
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(
    alertId: string,
    userId: string,
    _userRole: string
  ): Promise<IAlert> {
    const alert = await alertRepository.findById(alertId);

    if (!alert) {
      throw new NotFoundError('Alert');
    }

    // Verify access
    const isParent = alert.parentId.toString() === userId;
    const isChild = alert.childId.toString() === userId;

    if (!isParent && !isChild) {
      throw new AuthorizationError('Cannot access this alert');
    }

    const updatedAlert = await alertRepository.updateStatus(
      alertId,
      AlertStatus.ACKNOWLEDGED,
      userId
    );

    if (!updatedAlert) {
      throw new NotFoundError('Alert');
    }

    logger.info(`Alert ${alertId} acknowledged by ${userId}`);

    return updatedAlert;
  }

  /**
   * Resolve alert (parent only)
   */
  async resolveAlert(
    alertId: string,
    parentId: string,
    resolutionNotes?: string
  ): Promise<IAlert> {
    const alert = await alertRepository.findById(alertId);

    if (!alert) {
      throw new NotFoundError('Alert');
    }

    if (alert.parentId.toString() !== parentId) {
      throw new AuthorizationError('Only parents can resolve alerts');
    }

    const updatedAlert = await alertRepository.updateStatus(
      alertId,
      AlertStatus.RESOLVED,
      parentId,
      resolutionNotes
    );

    if (!updatedAlert) {
      throw new NotFoundError('Alert');
    }

    logger.info(`Alert ${alertId} resolved by parent ${parentId}`);

    return updatedAlert;
  }

  /**
   * Get alert by ID
   */
  async getAlertById(alertId: string, userId: string): Promise<IAlert> {
    const alert = await alertRepository.findById(alertId);

    if (!alert) {
      throw new NotFoundError('Alert');
    }

    // Verify access
    if (
      alert.parentId.toString() !== userId &&
      alert.childId.toString() !== userId
    ) {
      throw new AuthorizationError('Cannot access this alert');
    }

    return alert;
  }

  /**
   * Get alerts for parent with filters
   */
  async getParentAlerts(
    parentId: string,
    page: number = 1,
    limit: number = 20,
    filters: { status?: AlertStatus; severity?: AlertSeverity } = {}
  ): Promise<{ alerts: IAlert[]; total: number; page: number; limit: number }> {
    const result = await alertRepository.findByParentId(parentId, page, limit, filters);
    return { ...result, page, limit };
  }

  /**
   * Get pending alert count for parent
   */
  async getPendingCount(parentId: string): Promise<number> {
    return alertRepository.getPendingCount(parentId);
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(
    alertId: string,
    userId: string,
    status: AlertStatus
  ): Promise<IAlert> {
    const alert = await alertRepository.findById(alertId);

    if (!alert) {
      throw new NotFoundError('Alert');
    }

    // Verify access (must be parent)
    if (alert.parentId.toString() !== userId) {
      throw new AuthorizationError('Only parent can update alert status');
    }

    alert.status = status;
    if (status === AlertStatus.RESOLVED) {
      alert.resolvedAt = new Date();
    }

    await alert.save();
    return alert;
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(
    parentId: string,
    childId?: string
  ): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
  }> {
    const query: any = { parentId };
    if (childId) {
      query.childId = childId;
    }

    const Alert = (await import('./alert.model')).default;
    const alerts = await Alert.find(query);

    const stats = {
      total: alerts.length,
      bySeverity: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
    };

    // Count by severity
    alerts.forEach((alert) => {
      const severity = alert.severity;
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;

      const status = alert.status;
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;

      alert.categories.forEach((category) => {
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      });
    });

    return stats;
  }
}

export const alertService = new AlertService();
export default alertService;
