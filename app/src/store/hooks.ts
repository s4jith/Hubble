import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { useCallback, useMemo } from 'react';
import type { RootState, AppDispatch } from './index';
import * as selectors from './selectors';

// Basic typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// ============ AUTH HOOKS ============
export const useAuth = () => {
  const user = useAppSelector(selectors.selectUser);
  const isAuthenticated = useAppSelector(selectors.selectIsAuthenticated);
  const isLoading = useAppSelector(selectors.selectAuthLoading);
  const error = useAppSelector(selectors.selectAuthError);
  const token = useAppSelector(selectors.selectToken);
  const userName = useAppSelector(selectors.selectUserName);
  const userInitials = useAppSelector(selectors.selectUserInitials);
  const userRole = useAppSelector(selectors.selectUserRole);

  return useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    error,
    token,
    userName,
    userInitials,
    userRole,
  }), [user, isAuthenticated, isLoading, error, token, userName, userInitials, userRole]);
};

// ============ PROFILE HOOKS ============
export const useProfile = () => {
  const profile = useAppSelector(selectors.selectProfile);
  const settings = useAppSelector(selectors.selectProfileSettings);
  const privacy = useAppSelector(selectors.selectPrivacySettings);
  const security = useAppSelector(selectors.selectSecuritySettings);
  const theme = useAppSelector(selectors.selectTheme);

  return useMemo(() => ({
    ...profile,
    settings,
    privacy,
    security,
    theme,
  }), [profile, settings, privacy, security, theme]);
};

export const useFamily = () => {
  const members = useAppSelector(selectors.selectFamilyMembers);
  const activeMembers = useAppSelector(selectors.selectActiveFamilyMembers);
  const pendingInvites = useAppSelector((state) => state.profile.pendingInvites);

  return useMemo(() => ({
    members,
    activeMembers,
    pendingInvites,
    totalCount: members.length,
    activeCount: activeMembers.length,
  }), [members, activeMembers, pendingInvites]);
};

export const useConnectedAccounts = () => {
  const accounts = useAppSelector(selectors.selectConnectedAccounts);
  const activeAccounts = useAppSelector(selectors.selectActiveConnectedAccounts);
  const monitoredAccounts = useAppSelector(selectors.selectMonitoredAccounts);

  return useMemo(() => ({
    accounts,
    activeAccounts,
    monitoredAccounts,
    connectedCount: activeAccounts.length,
    monitoredCount: monitoredAccounts.length,
  }), [accounts, activeAccounts, monitoredAccounts]);
};

// ============ DASHBOARD HOOKS ============
export const useDashboard = () => {
  const stats = useAppSelector(selectors.selectDashboardStats);
  const alerts = useAppSelector(selectors.selectAlerts);
  const unreadAlerts = useAppSelector(selectors.selectUnreadAlerts);
  const unreadCount = useAppSelector(selectors.selectUnreadAlertsCount);
  const recentActivity = useAppSelector(selectors.selectRecentActivity);
  const tips = useAppSelector(selectors.selectSecurityTips);
  const isLoading = useAppSelector((state) => state.dashboard.isLoading);

  return useMemo(() => ({
    stats,
    alerts,
    unreadAlerts,
    unreadCount,
    recentActivity,
    tips,
    isLoading,
  }), [stats, alerts, unreadAlerts, unreadCount, recentActivity, tips, isLoading]);
};

// ============ FEED HOOKS ============
export const useFeed = () => {
  const posts = useAppSelector(selectors.selectPosts);
  const filteredPosts = useAppSelector(selectors.selectFilteredPosts);
  const activeTab = useAppSelector(selectors.selectActiveTab);
  const savedPosts = useAppSelector(selectors.selectSavedPosts);
  const trendingPosts = useAppSelector(selectors.selectTrendingPosts);
  const isLoading = useAppSelector(selectors.selectFeedLoading);
  const draft = useAppSelector((state) => state.feed.draft);

  return useMemo(() => ({
    posts,
    filteredPosts,
    activeTab,
    savedPosts,
    trendingPosts,
    isLoading,
    draft,
  }), [posts, filteredPosts, activeTab, savedPosts, trendingPosts, isLoading, draft]);
};

export const usePost = (postId: string) => {
  const post = useAppSelector(selectors.selectPostById(postId));
  return post;
};

// ============ CHAT HOOKS ============
export const useChat = () => {
  const messages = useAppSelector(selectors.selectMessages);
  const isTyping = useAppSelector(selectors.selectIsTyping);
  const userScore = useAppSelector(selectors.selectUserScore);
  const category = useAppSelector(selectors.selectUserCategory);
  const emotionalState = useAppSelector(selectors.selectUserEmotionalState);
  const needsFollowUp = useAppSelector(selectors.selectNeedsFollowUp);
  const recentTopics = useAppSelector(selectors.selectRecentTopics);
  const geminiHistory = useAppSelector(selectors.selectGeminiHistory);

  return useMemo(() => ({
    messages,
    isTyping,
    userScore,
    category,
    emotionalState,
    needsFollowUp,
    recentTopics,
    geminiHistory,
  }), [messages, isTyping, userScore, category, emotionalState, needsFollowUp, recentTopics, geminiHistory]);
};

// ============ COMPLAINT HOOKS ============
export const useComplaints = () => {
  const complaints = useAppSelector(selectors.selectComplaints);
  const filteredComplaints = useAppSelector(selectors.selectFilteredComplaints);
  const stats = useAppSelector(selectors.selectComplaintStats);
  const filters = useAppSelector(selectors.selectComplaintFilters);
  const draft = useAppSelector(selectors.selectComplaintDraft);
  const current = useAppSelector(selectors.selectCurrentComplaint);
  const isLoading = useAppSelector((state) => state.complaint.isLoading);
  const isSubmitting = useAppSelector(selectors.selectIsSubmitting);

  return useMemo(() => ({
    complaints,
    filteredComplaints,
    stats,
    filters,
    draft,
    current,
    isLoading,
    isSubmitting,
  }), [complaints, filteredComplaints, stats, filters, draft, current, isLoading, isSubmitting]);
};

export const useComplaint = (complaintId: string) => {
  const complaint = useAppSelector(selectors.selectComplaintById(complaintId));
  return complaint;
};

// ============ NOTIFICATION HOOKS ============
export const useNotifications = () => {
  const notifications = useAppSelector(selectors.selectNotifications);
  const unreadNotifications = useAppSelector(selectors.selectUnreadNotifications);
  const unreadCount = useAppSelector(selectors.selectUnreadNotificationCount);
  const preferences = useAppSelector(selectors.selectNotificationPreferences);
  const urgentNotifications = useAppSelector(selectors.selectUrgentNotifications);
  const isLoading = useAppSelector((state) => state.notification.isLoading);

  return useMemo(() => ({
    notifications,
    unreadNotifications,
    unreadCount,
    preferences,
    urgentNotifications,
    isLoading,
  }), [notifications, unreadNotifications, unreadCount, preferences, urgentNotifications, isLoading]);
};

// ============ APP HOOKS ============
export const useApp = () => {
  const status = useAppSelector(selectors.selectAppStatus);
  const connectionStatus = useAppSelector(selectors.selectConnectionStatus);
  const isOnline = useAppSelector(selectors.selectIsOnline);
  const features = useAppSelector(selectors.selectAppFeatures);
  const config = useAppSelector(selectors.selectAppConfig);
  const globalLoading = useAppSelector(selectors.selectGlobalLoading);
  const toasts = useAppSelector(selectors.selectToasts);
  const modals = useAppSelector(selectors.selectModals);

  return useMemo(() => ({
    status,
    connectionStatus,
    isOnline,
    features,
    config,
    globalLoading,
    toasts,
    modals,
  }), [status, connectionStatus, isOnline, features, config, globalLoading, toasts, modals]);
};

export const useFeature = (feature: keyof RootState['app']['features']) => {
  return useAppSelector(selectors.selectIsFeatureEnabled(feature));
};

// ============ COMBINED HOOKS ============
export const useTotalUnreadCount = () => {
  return useAppSelector(selectors.selectTotalUnreadCount);
};

export const useUserFullProfile = () => {
  return useAppSelector(selectors.selectUserFullProfile);
};

export const useIsAppReady = () => {
  return useAppSelector(selectors.selectIsAppReady);
};

// Export selectors for direct use
export { selectors };

