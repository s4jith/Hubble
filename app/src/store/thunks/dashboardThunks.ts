import { createAsyncThunk } from '@reduxjs/toolkit';
import { alertsApi, dashboardApi, AlertStatus, AlertSeverity } from '../../services/api';

/**
 * Dashboard Thunks
 * Async actions for dashboard and alerts
 */

export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const data = await dashboardApi.getParentDashboard();
      return {
        stats: data.stats,
        recentActivity: data.recentActivity,
        children: data.children,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch dashboard data');
    }
  }
);

export const fetchAlerts = createAsyncThunk(
  'dashboard/fetchAlerts',
  async (
    params:
      | {
          page?: number;
          limit?: number;
          status?: AlertStatus;
          severity?: AlertSeverity;
          childId?: string;
        }
      | undefined,
    { rejectWithValue }
  ) => {
    try {
      const response = await alertsApi.getAlerts(params);
      return {
        alerts: response.alerts.map((a) => ({
          id: a.id,
          childId: a.childId,
          title: a.title,
          message: a.message,
          severity: a.severity,
          categories: a.categories,
          status: a.status,
          createdAt: a.createdAt,
          acknowledgedAt: a.acknowledgedAt,
          resolvedAt: a.resolvedAt,
        })),
        total: response.total,
        page: response.page,
        totalPages: response.totalPages,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch alerts');
    }
  }
);

export const fetchAlertStats = createAsyncThunk(
  'dashboard/fetchAlertStats',
  async (_, { rejectWithValue }) => {
    try {
      const stats = await alertsApi.getStats();
      return stats;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch alert stats');
    }
  }
);

export const fetchPendingAlertsCount = createAsyncThunk(
  'dashboard/fetchPendingCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await alertsApi.getPendingCount();
      return response.count;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch pending count');
    }
  }
);

export const acknowledgeAlert = createAsyncThunk(
  'dashboard/acknowledgeAlert',
  async (alertId: string, { rejectWithValue }) => {
    try {
      const alert = await alertsApi.acknowledgeAlert(alertId);
      return alert;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to acknowledge alert');
    }
  }
);

export const resolveAlert = createAsyncThunk(
  'dashboard/resolveAlert',
  async ({ alertId, notes }: { alertId: string; notes?: string }, { rejectWithValue }) => {
    try {
      const alert = await alertsApi.resolveAlert(alertId, notes);
      return alert;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to resolve alert');
    }
  }
);

export const fetchAnalytics = createAsyncThunk(
  'dashboard/fetchAnalytics',
  async (
    params: { period?: 'week' | 'month' | 'year'; childId?: string } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const analytics = await dashboardApi.getAnalytics(params);
      return analytics;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch analytics');
    }
  }
);
