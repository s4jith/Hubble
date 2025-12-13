import mongoose from 'mongoose';
import { Alert, IAlert } from './alert.model';
import { AlertSeverity, AlertStatus, AbuseCategory } from '../../config/constants';

/**
 * Alert Repository
 * Data access layer for alert operations
 */
export class AlertRepository {
  /**
   * Create a new alert
   */
  async createAlert(data: {
    childId: string;
    parentId: string;
    scanResultId: string;
    title: string;
    message: string;
    severity: AlertSeverity;
    categories: AbuseCategory[];
    severityScore: number;
    guidanceProvided?: string;
    resourcesShared?: string[];
  }): Promise<IAlert> {
    const alert = new Alert({
      childId: new mongoose.Types.ObjectId(data.childId),
      parentId: new mongoose.Types.ObjectId(data.parentId),
      scanResultId: new mongoose.Types.ObjectId(data.scanResultId),
      title: data.title,
      message: data.message,
      severity: data.severity,
      categories: data.categories,
      severityScore: data.severityScore,
      status: AlertStatus.PENDING,
      guidanceProvided: data.guidanceProvided,
      resourcesShared: data.resourcesShared,
    });

    return alert.save();
  }

  /**
   * Find alert by ID
   */
  async findById(alertId: string): Promise<IAlert | null> {
    return Alert.findById(alertId)
      .populate('childId', 'username firstName lastName')
      .populate('scanResultId');
  }

  /**
   * Find alerts for parent
   */
  async findByParentId(
    parentId: string,
    page: number = 1,
    limit: number = 20,
    filters: { status?: AlertStatus; severity?: AlertSeverity } = {}
  ): Promise<{ alerts: IAlert[]; total: number }> {
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {
      parentId: new mongoose.Types.ObjectId(parentId),
    };

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.severity) {
      query.severity = filters.severity;
    }

    const [alerts, total] = await Promise.all([
      Alert.find(query)
        .populate('childId', 'username firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Alert.countDocuments(query),
    ]);

    return { alerts, total };
  }

  /**
   * Find alerts for child
   */
  async findByChildId(
    childId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ alerts: IAlert[]; total: number }> {
    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      Alert.find({ childId: new mongoose.Types.ObjectId(childId) })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Alert.countDocuments({ childId: new mongoose.Types.ObjectId(childId) }),
    ]);

    return { alerts, total };
  }

  /**
   * Update alert status
   */
  async updateStatus(
    alertId: string,
    status: AlertStatus,
    userId: string,
    notes?: string
  ): Promise<IAlert | null> {
    const update: Record<string, unknown> = { status };

    if (status === AlertStatus.ACKNOWLEDGED) {
      update.acknowledgedAt = new Date();
      update.acknowledgedBy = new mongoose.Types.ObjectId(userId);
    } else if (status === AlertStatus.RESOLVED) {
      update.resolvedAt = new Date();
      update.resolvedBy = new mongoose.Types.ObjectId(userId);
      if (notes) {
        update.resolutionNotes = notes;
      }
    }

    return Alert.findByIdAndUpdate(alertId, update, { new: true });
  }

  /**
   * Mark parent as notified
   */
  async markParentNotified(alertId: string): Promise<IAlert | null> {
    return Alert.findByIdAndUpdate(
      alertId,
      {
        parentNotified: true,
        parentNotifiedAt: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Mark child as notified
   */
  async markChildNotified(alertId: string): Promise<IAlert | null> {
    return Alert.findByIdAndUpdate(
      alertId,
      {
        childNotified: true,
        childNotifiedAt: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Get pending alerts count for parent
   */
  async getPendingCount(parentId: string): Promise<number> {
    return Alert.countDocuments({
      parentId: new mongoose.Types.ObjectId(parentId),
      status: AlertStatus.PENDING,
    });
  }

  /**
   * Get high severity pending alerts
   */
  async getHighSeverityPending(parentId: string): Promise<IAlert[]> {
    return Alert.find({
      parentId: new mongoose.Types.ObjectId(parentId),
      status: AlertStatus.PENDING,
      severity: { $in: [AlertSeverity.HIGH, AlertSeverity.CRITICAL] },
    })
      .populate('childId', 'username firstName lastName')
      .sort({ createdAt: -1 });
  }
}

export const alertRepository = new AlertRepository();
export default alertRepository;
