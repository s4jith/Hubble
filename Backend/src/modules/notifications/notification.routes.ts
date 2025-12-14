import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

/**
 * Notification Routes
 * All routes require authentication
 */

// Get unread count (must be before /:id route)
router.get('/unread-count', authenticate, notificationController.getUnreadCount);

// Mark all as read (must be before /:id route)
router.put('/read-all', authenticate, notificationController.markAllAsRead);

// Clear read notifications (must be before /:id route)
router.delete('/clear-read', authenticate, notificationController.clearReadNotifications);

// Get all notifications
router.get('/', authenticate, notificationController.getNotifications);

// Get single notification
router.get('/:id', authenticate, notificationController.getNotification);

// Mark notification as read
router.put('/:id/read', authenticate, notificationController.markAsRead);

// Delete notification
router.delete('/:id', authenticate, notificationController.deleteNotification);

export default router;
