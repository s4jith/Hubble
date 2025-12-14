import mongoose from 'mongoose';
import { Notification, INotification, NotificationType, NotificationPriority } from './notification.model';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';

/**
 * Notification Service
 * Handles all notification-related business logic
 */
class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(data: {
    userId: mongoose.Types.ObjectId | string;
    type: NotificationType;
    priority?: NotificationPriority;
    title: string;
    message: string;
    data?: Record<string, any>;
    alertId?: mongoose.Types.ObjectId | string;
    scanResultId?: mongoose.Types.ObjectId | string;
    complaintId?: mongoose.Types.ObjectId | string;
    expiresAt?: Date;
  }): Promise<INotification> {
    const notification = await Notification.create({
      ...data,
      userId: new mongoose.Types.ObjectId(data.userId),
      alertId: data.alertId ? new mongoose.Types.ObjectId(data.alertId) : undefined,
      scanResultId: data.scanResultId ? new mongoose.Types.ObjectId(data.scanResultId) : undefined,
      complaintId: data.complaintId ? new mongoose.Types.ObjectId(data.complaintId) : undefined,
    });

    logger.info(`Notification created for user ${data.userId}: ${data.title}`);
    return notification;
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      type?: NotificationType;
      unreadOnly?: boolean;
    } = {}
  ): Promise<{
    notifications: INotification[];
    total: number;
    page: number;
    totalPages: number;
    unreadCount: number;
  }> {
    const { page = 1, limit = 20, type, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const query: Record<string, any> = { userId: new mongoose.Types.ObjectId(userId) };
    
    if (type) {
      query.type = type;
    }
    
    if (unreadOnly) {
      query.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: new mongoose.Types.ObjectId(userId), isRead: false }),
    ]);

    return {
      notifications: notifications as unknown as INotification[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  /**
   * Get a single notification
   */
  async getNotificationById(notificationId: string, userId: string): Promise<INotification> {
    const notification = await Notification.findOne({
      _id: new mongoose.Types.ObjectId(notificationId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    return notification;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<INotification> {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(notificationId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    );

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    return notification;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await Notification.updateMany(
      {
        userId: new mongoose.Types.ObjectId(userId),
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const result = await Notification.deleteOne({
      _id: new mongoose.Types.ObjectId(notificationId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError('Notification not found');
    }
  }

  /**
   * Delete all read notifications for a user
   */
  async clearReadNotifications(userId: string): Promise<{ deletedCount: number }> {
    const result = await Notification.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
      isRead: true,
    });

    return { deletedCount: result.deletedCount };
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    });
  }

  /**
   * Create bulk notifications for multiple users
   */
  async createBulkNotifications(
    userIds: string[],
    data: {
      type: NotificationType;
      priority?: NotificationPriority;
      title: string;
      message: string;
      data?: Record<string, any>;
    }
  ): Promise<INotification[]> {
    const notifications = userIds.map((userId) => ({
      userId: new mongoose.Types.ObjectId(userId),
      ...data,
    }));

    return Notification.insertMany(notifications) as unknown as Promise<INotification[]>;
  }
}

export const notificationService = new NotificationService();
