import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notification.service';
import { sendSuccess } from '../../utils/response';
import { HTTP_STATUS } from '../../config/constants';
import { NotificationType } from './notification.model';

/**
 * Notification Controller
 * Handles HTTP requests for notification operations
 */
class NotificationController {
  /**
   * Get all notifications for the authenticated user
   * GET /notifications
   */
  async getNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { page, limit, type, unreadOnly } = req.query;

      const result = await notificationService.getNotifications(userId, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        type: type as NotificationType,
        unreadOnly: unreadOnly === 'true',
      });

      sendSuccess(res, result, 'Notifications retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single notification
   * GET /notifications/:id
   */
  async getNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;

      const notification = await notificationService.getNotificationById(id, userId);

      sendSuccess(res, notification, 'Notification retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get unread count
   * GET /notifications/unread-count
   */
  async getUnreadCount(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const count = await notificationService.getUnreadCount(userId);

      sendSuccess(res, { unreadCount: count }, 'Unread count retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark notification as read
   * PUT /notifications/:id/read
   */
  async markAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;

      const notification = await notificationService.markAsRead(id, userId);

      sendSuccess(res, notification, 'Notification marked as read');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   * PUT /notifications/read-all
   */
  async markAllAsRead(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const result = await notificationService.markAllAsRead(userId);

      sendSuccess(res, result, 'All notifications marked as read');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a notification
   * DELETE /notifications/:id
   */
  async deleteNotification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const { id } = req.params;

      await notificationService.deleteNotification(id, userId);

      sendSuccess(res, null, 'Notification deleted', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clear all read notifications
   * DELETE /notifications/clear-read
   */
  async clearReadNotifications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = (req as any).user!.userId;
      const result = await notificationService.clearReadNotifications(userId);

      sendSuccess(res, result, 'Read notifications cleared');
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
