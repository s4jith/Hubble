import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification as deleteNotificationThunk, clearReadNotifications } from '../thunks/notificationThunks';

type NotificationType = 
  | 'alert' 
  | 'report_update' 
  | 'message' 
  | 'system' 
  | 'reminder' 
  | 'achievement'
  | 'safety_tip'
  | 'community';

type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

interface NotificationAction {
  label: string;
  route: string;
  params?: Record<string, string>;
}

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: NotificationPriority;
  icon?: string;
  imageUrl?: string;
  action?: NotificationAction;
  data?: Record<string, any>;
  expiresAt?: string;
  groupId?: string;
}

interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  alertNotifications: boolean;
  reportUpdates: boolean;
  communityNotifications: boolean;
  safetyTips: boolean;
  systemNotifications: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string;   // "07:00"
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface NotificationGroup {
  id: string;
  type: NotificationType;
  count: number;
  latestTimestamp: string;
  notifications: Notification[];
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  groupedNotifications: NotificationGroup[];
  preferences: NotificationPreferences;
  isLoading: boolean;
  lastFetchedAt: string | null;
  error: string | null;
  pushToken: string | null;
}

const defaultPreferences: NotificationPreferences = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  alertNotifications: true,
  reportUpdates: true,
  communityNotifications: true,
  safetyTips: true,
  systemNotifications: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  soundEnabled: true,
  vibrationEnabled: true,
};

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  groupedNotifications: [],
  preferences: defaultPreferences,
  isLoading: false,
  lastFetchedAt: null,
  error: null,
  pushToken: null,
};

// Helper to group notifications by type
const groupNotifications = (notifications: Notification[]): NotificationGroup[] => {
  const groups: Record<string, Notification[]> = {};
  
  notifications.forEach(notification => {
    const groupKey = notification.groupId || notification.type;
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
  });

  return Object.entries(groups).map(([id, notifs]) => ({
    id,
    type: notifs[0].type,
    count: notifs.length,
    latestTimestamp: notifs[0].timestamp,
    notifications: notifs,
  }));
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // Fetch notifications
    fetchNotificationsStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    setNotifications: (state, action: PayloadAction<Notification[]>) => {
      state.notifications = action.payload;
      state.unreadCount = action.payload.filter(n => !n.isRead).length;
      state.groupedNotifications = groupNotifications(action.payload);
      state.isLoading = false;
      state.lastFetchedAt = new Date().toISOString();
    },
    fetchNotificationsFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Add notification (for real-time push)
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
      state.groupedNotifications = groupNotifications(state.notifications);
    },

    // Mark as read
    markAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        state.unreadCount -= 1;
      }
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(n => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    },
    markGroupAsRead: (state, action: PayloadAction<string>) => {
      state.notifications.forEach(n => {
        if (n.groupId === action.payload || n.type === action.payload) {
          if (!n.isRead) {
            n.isRead = true;
            state.unreadCount -= 1;
          }
        }
      });
    },

    // Delete notifications
    deleteNotification: (state, action: PayloadAction<string>) => {
      const index = state.notifications.findIndex(n => n.id === action.payload);
      if (index !== -1) {
        if (!state.notifications[index].isRead) {
          state.unreadCount -= 1;
        }
        state.notifications.splice(index, 1);
        state.groupedNotifications = groupNotifications(state.notifications);
      }
    },
    deleteAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.groupedNotifications = [];
    },
    deleteReadNotifications: (state) => {
      state.notifications = state.notifications.filter(n => !n.isRead);
      state.groupedNotifications = groupNotifications(state.notifications);
    },

    // Preferences
    setPreferences: (state, action: PayloadAction<NotificationPreferences>) => {
      state.preferences = action.payload;
    },
    updatePreference: (state, action: PayloadAction<Partial<NotificationPreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    resetPreferences: (state) => {
      state.preferences = defaultPreferences;
    },

    // Push token
    setPushToken: (state, action: PayloadAction<string>) => {
      state.pushToken = action.payload;
    },
    clearPushToken: (state) => {
      state.pushToken = null;
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },

    // Reset
    resetNotifications: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        const notifications = action.payload.notifications.map((n: any) => ({
          id: n._id || n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          timestamp: n.createdAt,
          isRead: n.isRead,
          priority: n.priority || 'normal',
          icon: n.icon,
          imageUrl: n.imageUrl,
          action: n.action,
          data: n.data,
          expiresAt: n.expiresAt,
          groupId: n.groupId,
        }));
        state.notifications = notifications;
        state.unreadCount = notifications.filter((n: any) => !n.isRead).length;
        state.lastFetchedAt = new Date().toISOString();
        
        // Group notifications
        const groups: Record<string, any[]> = {};
        notifications.forEach((notification: any) => {
          const groupKey = notification.groupId || notification.type;
          if (!groups[groupKey]) {
            groups[groupKey] = [];
          }
          groups[groupKey].push(notification);
        });
        state.groupedNotifications = Object.entries(groups).map(([id, notifs]) => ({
          id,
          type: notifs[0].type,
          count: notifs.length,
          latestTimestamp: notifs[0].timestamp,
          notifications: notifs,
        }));
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Mark as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.meta.arg);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // Mark all as read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach(n => {
          n.isRead = true;
        });
        state.unreadCount = 0;
      })
      // Delete notification
      .addCase(deleteNotificationThunk.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(n => n.id === action.meta.arg);
        if (index !== -1) {
          if (!state.notifications[index].isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications.splice(index, 1);
        }
      })
      // Clear read notifications
      .addCase(clearReadNotifications.fulfilled, (state) => {
        state.notifications = state.notifications.filter(n => !n.isRead);
      });
  },
});

export const {
  fetchNotificationsStart,
  setNotifications,
  fetchNotificationsFailure,
  addNotification,
  markAsRead,
  markAllAsRead,
  markGroupAsRead,
  deleteNotification,
  deleteAllNotifications,
  deleteReadNotifications,
  setPreferences,
  updatePreference,
  resetPreferences,
  setPushToken,
  clearPushToken,
  setError,
  clearError,
  resetNotifications,
} = notificationSlice.actions;

export type { Notification, NotificationType, NotificationPriority, NotificationPreferences };
export default notificationSlice.reducer;
