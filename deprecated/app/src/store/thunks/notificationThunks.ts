import { createAsyncThunk } from '@reduxjs/toolkit';
import { notificationsApi, NotificationType } from '../../services/api';

/**
 * Notification Thunks
 * Async actions for notifications
 */

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (
    params:
      | {
          page?: number;
          limit?: number;
          type?: NotificationType;
          unreadOnly?: boolean;
        }
      | undefined,
    { rejectWithValue }
  ) => {
    try {
      const response = await notificationsApi.getNotifications(params);
      return {
        notifications: response.notifications.map((n) => ({
          id: n.id,
          type: n.type,
          priority: n.priority,
          title: n.title,
          message: n.message,
          data: n.data,
          isRead: n.isRead,
          readAt: n.readAt,
          createdAt: n.createdAt,
        })),
        unreadCount: response.unreadCount,
        total: response.total,
        page: response.page,
        totalPages: response.totalPages,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notification/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationsApi.getUnreadCount();
      return response.unreadCount;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch unread count');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark as read');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationsApi.markAllAsRead();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark all as read');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notification/delete',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationsApi.deleteNotification(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete notification');
    }
  }
);

export const clearReadNotifications = createAsyncThunk(
  'notification/clearRead',
  async (_, { rejectWithValue }) => {
    try {
      await notificationsApi.clearReadNotifications();
      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to clear notifications');
    }
  }
);
