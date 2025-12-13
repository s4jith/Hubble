import mongoose from 'mongoose';
import { ScanResult, IScanResult, IAIAnalysis } from './scan.model';
import { ScanType, AlertSeverity } from '../../config/constants';

/**
 * Scan Repository
 * Data access layer for scan-related operations
 */
export class ScanRepository {
  /**
   * Create a new scan result
   */
  async createScanResult(data: {
    userId: string;
    parentId: string;
    scanType: ScanType;
    content: string;
    sourceApp?: string;
    analysis: IAIAnalysis;
    severity: AlertSeverity;
    processedAt: Date;
    processingTimeMs: number;
    aiServiceVersion?: string;
    manuallyReported?: boolean;
  }): Promise<IScanResult> {
    const scanResult = new ScanResult({
      userId: new mongoose.Types.ObjectId(data.userId),
      parentId: new mongoose.Types.ObjectId(data.parentId),
      scanType: data.scanType,
      content: data.content,
      sourceApp: data.sourceApp,
      analysis: data.analysis,
      severity: data.severity,
      processedAt: data.processedAt,
      processingTimeMs: data.processingTimeMs,
      aiServiceVersion: data.aiServiceVersion,
      manuallyReported: data.manuallyReported ?? false,
    });

    return scanResult.save();
  }

  /**
   * Get scan result by ID
   */
  async findById(id: string): Promise<IScanResult | null> {
    return ScanResult.findById(id);
  }

  /**
   * Get scan results for a user
   */
  async findByUserId(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ scans: IScanResult[]; total: number }> {
    const skip = (page - 1) * limit;

    const [scans, total] = await Promise.all([
      ScanResult.find({ userId: new mongoose.Types.ObjectId(userId) })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      ScanResult.countDocuments({ userId: new mongoose.Types.ObjectId(userId) }),
    ]);

    return { scans, total };
  }

  /**
   * Get scan results for a parent (all children)
   */
  async findByParentId(
    parentId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ scans: IScanResult[]; total: number }> {
    const skip = (page - 1) * limit;

    const [scans, total] = await Promise.all([
      ScanResult.find({ parentId: new mongoose.Types.ObjectId(parentId) })
        .populate('userId', 'username firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      ScanResult.countDocuments({ parentId: new mongoose.Types.ObjectId(parentId) }),
    ]);

    return { scans, total };
  }

  /**
   * Get abusive scan results
   */
  async findAbusive(
    parentId: string,
    page: number = 1,
    limit: number = 20,
    filters: { severity?: AlertSeverity; childId?: string } = {}
  ): Promise<{ scans: IScanResult[]; total: number }> {
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      parentId: new mongoose.Types.ObjectId(parentId),
      'analysis.isAbusive': true,
    };

    if (filters.severity) {
      query.severity = filters.severity;
    }
    if (filters.childId) {
      query.userId = new mongoose.Types.ObjectId(filters.childId);
    }

    const [scans, total] = await Promise.all([
      ScanResult.find(query)
        .populate('userId', 'username firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      ScanResult.countDocuments(query),
    ]);

    return { scans, total };
  }

  /**
   * Mark scan as reviewed
   */
  async markAsReviewed(
    scanId: string,
    reviewedBy: string,
    notes?: string
  ): Promise<IScanResult | null> {
    return ScanResult.findByIdAndUpdate(
      scanId,
      {
        reviewedBy: new mongoose.Types.ObjectId(reviewedBy),
        reviewNotes: notes,
      },
      { new: true }
    );
  }

  /**
   * Get recent scans count
   */
  async getRecentCount(userId: string, hours: number = 24): Promise<number> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return ScanResult.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      createdAt: { $gte: since },
    });
  }
}

export const scanRepository = new ScanRepository();
export default scanRepository;
