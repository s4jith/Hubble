import { apiClient } from './client';

/**
 * Alert Types
 */
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'pending' | 'acknowledged' | 'resolved' | 'escalated';

export interface Alert {
  id: string;
  childId: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  categories: string[];
  severityScore: number;
  status: AlertStatus;
  acknowledgedAt?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
  guidanceProvided?: string;
  createdAt: string;
}

export interface AlertsResponse {
  alerts: Alert[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AlertStats {
  total: number;
  pending: number;
  acknowledged: number;
  resolved: number;
  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

/**
 * Dashboard Types
 */
export interface DashboardStats {
  totalScans: number;
  flaggedContent: number;
  safetyScore: number;
  activeAlerts: number;
  weeklyChange: {
    scans: number;
    flagged: number;
    score: number;
  };
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: {
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    severity?: AlertSeverity;
  }[];
  children?: {
    id: string;
    name: string;
    avatar?: string;
    lastActive?: string;
    safetyScore: number;
  }[];
}

/**
 * Alerts API Service
 */
export const alertsApi = {
  /**
   * Get all alerts (for parents)
   */
  async getAlerts(params?: {
    page?: number;
    limit?: number;
    status?: AlertStatus;
    severity?: AlertSeverity;
    childId?: string;
  }): Promise<AlertsResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.severity) query.append('severity', params.severity);
    if (params?.childId) query.append('childId', params.childId);

    return apiClient.get<AlertsResponse>(`/alerts?${query.toString()}`);
  },

  /**
   * Get pending alerts count
   */
  async getPendingCount(): Promise<{ count: number }> {
    return apiClient.get<{ count: number }>('/alerts/pending/count');
  },

  /**
   * Get alert statistics
   */
  async getStats(): Promise<AlertStats> {
    return apiClient.get<AlertStats>('/alerts/stats');
  },

  /**
   * Get single alert
   */
  async getAlert(alertId: string): Promise<Alert> {
    return apiClient.get<Alert>(`/alerts/${alertId}`);
  },

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string): Promise<Alert> {
    return apiClient.post<Alert>(`/alerts/${alertId}/acknowledge`);
  },

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, notes?: string): Promise<Alert> {
    return apiClient.post<Alert>(`/alerts/${alertId}/resolve`, { notes });
  },
};

/**
 * Dashboard API Service
 */
export const dashboardApi = {
  /**
   * Get parent dashboard data
   */
  async getParentDashboard(): Promise<DashboardData> {
    return apiClient.get<DashboardData>('/parent/dashboard');
  },

  /**
   * Get analytics data
   */
  async getAnalytics(params?: {
    period?: 'week' | 'month' | 'year';
    childId?: string;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.period) query.append('period', params.period);
    if (params?.childId) query.append('childId', params.childId);

    return apiClient.get(`/parent/analytics?${query.toString()}`);
  },
};
