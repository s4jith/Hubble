import mongoose from 'mongoose';
import { MentalHealthResource, IMentalHealthResource } from './mentalHealthResource.model';
import { ScanResult, IScanResult } from '../scan/scan.model';
import { Alert, IAlert } from '../alerts/alert.model';
import { AlertSeverity, AlertStatus } from '../../config/constants';

/**
 * Child Repository
 * Data access layer for child-specific operations
 */
export class ChildRepository {
  /**
   * Get scan history for child
   */
  async getScanHistory(
    childId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ scans: IScanResult[]; total: number }> {
    const skip = (page - 1) * limit;

    const [scans, total] = await Promise.all([
      ScanResult.find({ userId: new mongoose.Types.ObjectId(childId) })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      ScanResult.countDocuments({ userId: new mongoose.Types.ObjectId(childId) }),
    ]);

    return { scans, total };
  }

  /**
   * Get alerts for child
   */
  async getAlerts(
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
   * Get mental health resources based on severity and categories
   */
  async getResources(
    severityScore: number,
    categories: string[],
    age?: number
  ): Promise<IMentalHealthResource[]> {
    const query: Record<string, unknown> = {
      isActive: true,
      minSeverityScore: { $lte: severityScore },
      maxSeverityScore: { $gte: severityScore },
    };

    // Filter by categories if provided
    if (categories.length > 0) {
      query.$or = [
        { categories: { $in: categories } },
        { categories: { $size: 0 } }, // Include general resources
      ];
    }

    // Filter by age if provided
    if (age !== undefined) {
      query.$and = [
        { $or: [{ minAge: { $lte: age } }, { minAge: { $exists: false } }] },
        { $or: [{ maxAge: { $gte: age } }, { maxAge: { $exists: false } }] },
      ];
    }

    return MentalHealthResource.find(query).sort({ priority: -1, isEmergency: -1 });
  }

  /**
   * Get emergency resources
   */
  async getEmergencyResources(): Promise<IMentalHealthResource[]> {
    return MentalHealthResource.find({
      isActive: true,
      isEmergency: true,
    }).sort({ priority: -1 });
  }

  /**
   * Get all resources
   */
  async getAllResources(
    page: number = 1,
    limit: number = 20
  ): Promise<{ resources: IMentalHealthResource[]; total: number }> {
    const skip = (page - 1) * limit;

    const [resources, total] = await Promise.all([
      MentalHealthResource.find({ isActive: true })
        .skip(skip)
        .limit(limit)
        .sort({ priority: -1 }),
      MentalHealthResource.countDocuments({ isActive: true }),
    ]);

    return { resources, total };
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, childId: string): Promise<IAlert | null> {
    return Alert.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(alertId),
        childId: new mongoose.Types.ObjectId(childId),
      },
      {
        status: AlertStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        acknowledgedBy: new mongoose.Types.ObjectId(childId),
        childNotified: true,
        childNotifiedAt: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Create manual report
   */
  async createManualReport(data: {
    childId: string;
    parentId: string;
    content: string;
    description: string;
    sourceApp?: string;
  }): Promise<IScanResult> {
    const scanResult = new ScanResult({
      userId: new mongoose.Types.ObjectId(data.childId),
      parentId: new mongoose.Types.ObjectId(data.parentId),
      scanType: 'text',
      content: data.content,
      sourceApp: data.sourceApp,
      analysis: {
        isAbusive: true, // Manual reports are treated as potentially abusive
        categories: ['other'],
        severityScore: 50, // Medium severity for manual reports
        confidence: 1, // Full confidence since manually reported
        sentiment: 'reported',
        threatDetected: false,
      },
      severity: AlertSeverity.MEDIUM,
      processedAt: new Date(),
      processingTimeMs: 0,
      manuallyReported: true,
    });

    return scanResult.save();
  }
}

export const childRepository = new ChildRepository();
export default childRepository;
