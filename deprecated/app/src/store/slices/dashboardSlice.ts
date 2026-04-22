import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchDashboardData, fetchAlerts, acknowledgeAlert } from '../thunks/dashboardThunks';

interface DashboardStats {
  totalReports: number;
  activeAlerts: number;
  resolved: number;
  pending: number;
  weeklyChange?: number;
}

interface Alert {
  id: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

interface RecentActivity {
  id: string;
  type: 'report_filed' | 'report_resolved' | 'chat_session' | 'profile_update' | 'alert_received';
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

interface SecurityTip {
  id: string;
  title: string;
  content: string;
  category: 'privacy' | 'safety' | 'awareness' | 'prevention';
  isRead: boolean;
}

interface DashboardState {
  stats: DashboardStats;
  alerts: Alert[];
  recentActivity: RecentActivity[];
  securityTips: SecurityTip[];
  quickActions: QuickAction[];
  unreadAlertsCount: number;
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: string | null;
  error: string | null;
}

const initialState: DashboardState = {
  stats: {
    totalReports: 0,
    activeAlerts: 0,
    resolved: 0,
    pending: 0,
    weeklyChange: 0,
  },
  alerts: [],
  recentActivity: [],
  securityTips: [],
  quickActions: [
    {
      id: '1',
      title: 'Talk with Echo',
      description: 'Chat with our AI companion',
      icon: 'MessageCircle',
      route: 'ChatBot',
      color: '#4CAF50',
    },
    {
      id: '2',
      title: 'File Complaint',
      description: 'Report an incident',
      icon: 'FileText',
      route: 'ComplaintUpload',
      color: '#2196F3',
    },
  ],
  unreadAlertsCount: 0,
  isLoading: false,
  isRefreshing: false,
  lastUpdated: null,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // Stats management
    setStats: (state, action: PayloadAction<DashboardStats>) => {
      state.stats = action.payload;
      state.lastUpdated = new Date().toISOString();
    },
    updateStat: (state, action: PayloadAction<{ key: keyof DashboardStats; value: number }>) => {
      (state.stats[action.payload.key] as number) = action.payload.value;
    },
    incrementStat: (state, action: PayloadAction<keyof DashboardStats>) => {
      (state.stats[action.payload] as number) += 1;
    },
    decrementStat: (state, action: PayloadAction<keyof DashboardStats>) => {
      const current = state.stats[action.payload] as number;
      if (current > 0) {
        (state.stats[action.payload] as number) -= 1;
      }
    },

    // Alerts management
    setAlerts: (state, action: PayloadAction<Alert[]>) => {
      state.alerts = action.payload;
      state.unreadAlertsCount = action.payload.filter(a => !a.isRead).length;
    },
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadAlertsCount += 1;
      }
    },
    markAlertAsRead: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find(a => a.id === action.payload);
      if (alert && !alert.isRead) {
        alert.isRead = true;
        state.unreadAlertsCount -= 1;
      }
    },
    markAllAlertsAsRead: (state) => {
      state.alerts.forEach(alert => {
        alert.isRead = true;
      });
      state.unreadAlertsCount = 0;
    },
    removeAlert: (state, action: PayloadAction<string>) => {
      const index = state.alerts.findIndex(a => a.id === action.payload);
      if (index !== -1) {
        if (!state.alerts[index].isRead) {
          state.unreadAlertsCount -= 1;
        }
        state.alerts.splice(index, 1);
      }
    },
    clearAlerts: (state) => {
      state.alerts = [];
      state.unreadAlertsCount = 0;
    },

    // Recent activity
    setRecentActivity: (state, action: PayloadAction<RecentActivity[]>) => {
      state.recentActivity = action.payload;
    },
    addActivity: (state, action: PayloadAction<RecentActivity>) => {
      state.recentActivity.unshift(action.payload);
      // Keep only last 20 activities
      if (state.recentActivity.length > 20) {
        state.recentActivity = state.recentActivity.slice(0, 20);
      }
    },
    clearActivity: (state) => {
      state.recentActivity = [];
    },

    // Security tips
    setSecurityTips: (state, action: PayloadAction<SecurityTip[] | string[]>) => {
      // Handle both old string[] format and new SecurityTip[] format
      if (action.payload.length > 0 && typeof action.payload[0] === 'string') {
        state.securityTips = (action.payload as string[]).map((tip, index) => ({
          id: `tip_${index}`,
          title: 'Security Tip',
          content: tip,
          category: 'safety' as const,
          isRead: false,
        }));
      } else {
        state.securityTips = action.payload as SecurityTip[];
      }
    },
    markTipAsRead: (state, action: PayloadAction<string>) => {
      const tip = state.securityTips.find(t => t.id === action.payload);
      if (tip) {
        tip.isRead = true;
      }
    },

    // Quick actions
    setQuickActions: (state, action: PayloadAction<QuickAction[]>) => {
      state.quickActions = action.payload;
    },

    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setRefreshing: (state, action: PayloadAction<boolean>) => {
      state.isRefreshing = action.payload;
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },

    // Full refresh
    refreshDashboard: (state) => {
      state.isRefreshing = true;
      state.error = null;
    },
    refreshDashboardSuccess: (state, action: PayloadAction<{
      stats: DashboardStats;
      alerts: Alert[];
      recentActivity: RecentActivity[];
    }>) => {
      state.stats = action.payload.stats;
      state.alerts = action.payload.alerts;
      state.recentActivity = action.payload.recentActivity;
      state.unreadAlertsCount = action.payload.alerts.filter(a => !a.isRead).length;
      state.isRefreshing = false;
      state.lastUpdated = new Date().toISOString();
    },
    refreshDashboardFailure: (state, action: PayloadAction<string>) => {
      state.isRefreshing = false;
      state.error = action.payload;
    },

    // Reset
    resetDashboard: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard data
      .addCase(fetchDashboardData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        const data = action.payload;
        
        // Map stats - handle different stat formats
        if (data.stats) {
          const stats = data.stats as any;
          state.stats = {
            totalReports: stats.scans || stats.totalReports || 0,
            activeAlerts: stats.flagged || stats.activeAlerts || 0,
            resolved: stats.resolved || 0,
            pending: stats.flagged || stats.pending || 0,
            weeklyChange: typeof stats.weeklyChange === 'number' ? stats.weeklyChange : 0,
          };
        }
        
        // Map recent activity
        if (data.recentActivity) {
          state.recentActivity = data.recentActivity.map((a: any) => ({
            id: a.id,
            type: a.type as any,
            title: a.title,
            description: a.description,
            timestamp: a.timestamp,
            icon: a.icon,
          }));
        }
        
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoading = false;
        state.isRefreshing = false;
        state.error = action.payload as string;
      })
      // Fetch alerts
      .addCase(fetchAlerts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.isLoading = false;
        const alerts = action.payload.alerts || [];
        state.alerts = alerts.map((a: any) => ({
          id: a.id,
          type: a.severity === 'high' || a.severity === 'critical' ? 'danger' : 
                a.severity === 'medium' ? 'warning' : 'info',
          title: a.title,
          message: a.message,
          timestamp: a.createdAt,
          isRead: a.status === 'acknowledged' || a.status === 'resolved',
          actionUrl: undefined,
        }));
        state.unreadAlertsCount = state.alerts.filter(a => !a.isRead).length;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Acknowledge alert
      .addCase(acknowledgeAlert.fulfilled, (state, action) => {
        const alert = state.alerts.find(a => a.id === action.meta.arg);
        if (alert && !alert.isRead) {
          alert.isRead = true;
          state.unreadAlertsCount = Math.max(0, state.unreadAlertsCount - 1);
        }
      });
  },
});

export const { 
  setStats, 
  updateStat,
  incrementStat,
  decrementStat,
  setAlerts,
  addAlert,
  markAlertAsRead,
  markAllAlertsAsRead,
  removeAlert,
  clearAlerts,
  setRecentActivity,
  addActivity,
  clearActivity,
  setSecurityTips,
  markTipAsRead,
  setQuickActions,
  setLoading,
  setRefreshing,
  setError,
  clearError,
  refreshDashboard,
  refreshDashboardSuccess,
  refreshDashboardFailure,
  resetDashboard,
} = dashboardSlice.actions;

export type { DashboardStats, Alert, RecentActivity, QuickAction, SecurityTip };
export default dashboardSlice.reducer;
