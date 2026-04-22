/**
 * API Services - Centralized Export
 * 
 * All API services for the Hubble app
 */

// Core client
export { apiClient, tokenManager, ApiError } from './client';
export type { ApiResponse } from './client';

// Auth
export { authApi } from './auth';
export type { LoginRequest, SignupRequest, AuthResponse, UserProfile } from './auth';

// Notifications
export { notificationsApi } from './notifications';
export type { Notification, NotificationType, NotificationPriority, NotificationsResponse } from './notifications';

// Feed
export { feedApi } from './feed';
export type { FeedPost, FeedType, PostsResponse, Comment, CommentsResponse } from './feed';

// Complaints
export { complaintsApi } from './complaints';
export type {
  Complaint,
  ComplaintStatus,
  ComplaintPriority,
  Evidence,
  EvidenceType,
  TimelineEntry,
  ComplaintsResponse,
} from './complaints';

// Chat
export { chatApi } from './chat';
export type {
  ChatMessage,
  ChatSession,
  MessageSender,
  MessageType,
  SessionsResponse,
  SendMessageResponse,
  UserScore,
} from './chat';

// Alerts & Dashboard
export { alertsApi, dashboardApi } from './dashboard';
export type {
  Alert,
  AlertSeverity,
  AlertStatus,
  AlertsResponse,
  AlertStats,
  DashboardStats,
  DashboardData,
} from './dashboard';

// Scan
export { scanApi } from './scan';
export type { ScanResult, ScanType, ScanHistoryResponse } from './scan';
