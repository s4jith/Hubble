import mongoose from 'mongoose';
import { User, IUser } from '../users/user.model';
import { ScanResult, IScanResult } from '../scan/scan.model';
import { Alert, IAlert } from '../alerts/alert.model';
import { Settings, ISettings } from './settings.model';
import { UserRole, AlertSeverity, AlertStatus } from '../../config/constants';

/**
 * Parent Repository
 * Data access layer for parent-specific operations
 */
export class ParentRepository {
  /**
   * Get all children for a parent
   */
  async getChildren(parentId: string): Promise<IUser[]> {
    return User.find({
      parentId: new mongoose.Types.ObjectId(parentId),
      role: UserRole.CHILD,
    }).sort({ createdAt: -1 });
  }

  /**
   * Get child by ID (verify ownership)
   */
  async getChildById(parentId: string, childId: string): Promise<IUser | null> {
    return User.findOne({
      _id: new mongoose.Types.ObjectId(childId),
      parentId: new mongoose.Types.ObjectId(parentId),
      role: UserRole.CHILD,
    });
  }

  /**
   * Get incidents (scan results with abuse) for parent's children
   */
  async getIncidents(
    parentId: string,
    page: number = 1,
    limit: number = 20,
    filters: {
      childId?: string;
      severity?: AlertSeverity;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ incidents: IScanResult[]; total: number }> {
    const skip = (page - 1) * limit;
    
    const query: Record<string, unknown> = {
      parentId: new mongoose.Types.ObjectId(parentId),
      'analysis.isAbusive': true,
    };

    if (filters.childId) {
      query.userId = new mongoose.Types.ObjectId(filters.childId);
    }
    if (filters.severity) {
      query.severity = filters.severity;
    }
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        (query.createdAt as Record<string, unknown>).$gte = filters.startDate;
      }
      if (filters.endDate) {
        (query.createdAt as Record<string, unknown>).$lte = filters.endDate;
      }
    }

    const [incidents, total] = await Promise.all([
      ScanResult.find(query)
        .populate('userId', 'username firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      ScanResult.countDocuments(query),
    ]);

    return { incidents, total };
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
    if (filters.childId) {
      query.childId = new mongoose.Types.ObjectId(filters.childId);
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
   * Get analytics for parent
   */
  async getAnalytics(
    parentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalScans: number;
    abusiveScans: number;
    bySeverity: Record<AlertSeverity, number>;
    byCategory: Record<string, number>;
    byChild: { childId: string; childName: string; count: number }[];
    trend: { date: string; count: number }[];
  }> {
    const parentObjId = new mongoose.Types.ObjectId(parentId);

    // Total scans
    const totalScans = await ScanResult.countDocuments({
      parentId: parentObjId,
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // Abusive scans
    const abusiveScans = await ScanResult.countDocuments({
      parentId: parentObjId,
      'analysis.isAbusive': true,
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // By severity
    const severityAgg = await ScanResult.aggregate([
      {
        $match: {
          parentId: parentObjId,
          'analysis.isAbusive': true,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    const bySeverity = Object.values(AlertSeverity).reduce((acc, severity) => {
      acc[severity] = 0;
      return acc;
    }, {} as Record<AlertSeverity, number>);

    severityAgg.forEach((item) => {
      bySeverity[item._id as AlertSeverity] = item.count;
    });

    // By category
    const categoryAgg = await ScanResult.aggregate([
      {
        $match: {
          parentId: parentObjId,
          'analysis.isAbusive': true,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $unwind: '$analysis.categories' },
      { $group: { _id: '$analysis.categories', count: { $sum: 1 } } },
    ]);

    const byCategory: Record<string, number> = {};
    categoryAgg.forEach((item) => {
      byCategory[item._id] = item.count;
    });

    // By child
    const childAgg = await ScanResult.aggregate([
      {
        $match: {
          parentId: parentObjId,
          'analysis.isAbusive': true,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'child',
        },
      },
      { $unwind: '$child' },
      {
        $project: {
          childId: '$_id',
          childName: { $concat: ['$child.firstName', ' ', '$child.lastName'] },
          count: 1,
        },
      },
    ]);

    const byChild = childAgg.map((item) => ({
      childId: item.childId.toString(),
      childName: item.childName,
      count: item.count,
    }));

    // Trend (daily)
    const trendAgg = await ScanResult.aggregate([
      {
        $match: {
          parentId: parentObjId,
          'analysis.isAbusive': true,
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const trend = trendAgg.map((item) => ({
      date: item._id,
      count: item.count,
    }));

    return {
      totalScans,
      abusiveScans,
      bySeverity,
      byCategory,
      byChild,
      trend,
    };
  }

  /**
   * Get or create settings for parent
   */
  async getSettings(parentId: string): Promise<ISettings> {
    let settings = await Settings.findOne({ userId: new mongoose.Types.ObjectId(parentId) });

    if (!settings) {
      settings = await Settings.create({ userId: new mongoose.Types.ObjectId(parentId) });
    }

    return settings;
  }

  /**
   * Update parent settings
   */
  async updateSettings(parentId: string, updateData: Partial<ISettings>): Promise<ISettings> {
    const settings = await Settings.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(parentId) },
      { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    );

    return settings;
  }
}

export const parentRepository = new ParentRepository();
export default parentRepository;
