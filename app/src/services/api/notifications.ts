import { apiClient } from './client';

/**
 * Notification Types
 */
export type NotificationType =
  | 'alert'
  | 'scan_result'
  | 'report_update'
  | 'child_activity'
  | 'security'
  | 'system'
  | 'chat';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  totalPages: number;
  unreadCount: number;
}

/**
 * Notifications API Service
 */
export const notificationsApi = {
  /**
   * Get all notifications
   */
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    type?: NotificationType;
    unreadOnly?: boolean;
  }): Promise<NotificationsResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.type) query.append('type', params.type);
    if (params?.unreadOnly) query.append('unreadOnly', 'true');

    return apiClient.get<NotificationsResponse>(`/notifications?${query.toString()}`);
  },

  /**
   * Get unread count
   */
  async getUnreadCount(): Promise<{ unreadCount: number }> {
    return apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    return apiClient.put<Notification>(`/notifications/${notificationId}/read`);
  },

  /**
   * Mark all as read
   */
  async markAllAsRead(): Promise<{ modifiedCount: number }> {
    return apiClient.put<{ modifiedCount: number }>('/notifications/read-all');
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    return apiClient.delete(`/notifications/${notificationId}`);
  },

  /**
   * Clear all read notifications
   */
  async clearReadNotifications(): Promise<{ deletedCount: number }> {
    return apiClient.delete<{ deletedCount: number }>('/notifications/clear-read');
  },
};
