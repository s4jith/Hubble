import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';

// ============ AUTH SELECTORS ============
export const selectAuth = (state: RootState) => state.auth;
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectToken = (state: RootState) => state.auth.token;

export const selectUserName = createSelector(
  selectUser,
  (user) => user?.name || 'Guest'
);

export const selectUserInitials = createSelector(
  selectUser,
  (user) => {
    if (!user?.name) return 'G';
    return user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
);

export const selectUserRole = createSelector(
  selectUser,
  (user) => user?.role || 'user'
);

// ============ PROFILE SELECTORS ============
export const selectProfile = (state: RootState) => state.profile;
export const selectProfileSettings = (state: RootState) => state.profile.appSettings;
export const selectPrivacySettings = (state: RootState) => state.profile.privacySettings;
export const selectSecuritySettings = (state: RootState) => state.profile.securitySettings;
export const selectConnectedAccounts = (state: RootState) => state.profile.connectedAccounts;
export const selectFamilyMembers = (state: RootState) => state.profile.familyMembers;
export const selectTheme = (state: RootState) => state.profile.appSettings.theme;

export const selectActiveConnectedAccounts = createSelector(
  selectConnectedAccounts,
  (accounts) => accounts.filter(a => a.isConnected)
);

export const selectMonitoredAccounts = createSelector(
  selectConnectedAccounts,
  (accounts) => accounts.filter(a => a.isConnected && a.monitoringEnabled)
);

export const selectActiveFamilyMembers = createSelector(
  selectFamilyMembers,
  (members) => members.filter(m => m.status === 'active')
);

// ============ DASHBOARD SELECTORS ============
export const selectDashboard = (state: RootState) => state.dashboard;
export const selectDashboardStats = (state: RootState) => state.dashboard.stats;
export const selectAlerts = (state: RootState) => state.dashboard.alerts;
export const selectUnreadAlertsCount = (state: RootState) => state.dashboard.unreadAlertsCount;
export const selectRecentActivity = (state: RootState) => state.dashboard.recentActivity;
export const selectSecurityTips = (state: RootState) => state.dashboard.securityTips;

export const selectUnreadAlerts = createSelector(
  selectAlerts,
  (alerts) => alerts.filter(a => !a.isRead)
);

export const selectCriticalAlerts = createSelector(
  selectAlerts,
  (alerts) => alerts.filter(a => a.type === 'danger')
);

// ============ FEED SELECTORS ============
export const selectFeed = (state: RootState) => state.feed;
export const selectPosts = (state: RootState) => state.feed.posts;
export const selectActiveTab = (state: RootState) => state.feed.activeTab;
export const selectFeedLoading = (state: RootState) => state.feed.isLoading;
export const selectSavedPosts = (state: RootState) => state.feed.savedPosts;
export const selectTrendingPosts = (state: RootState) => state.feed.trendingPosts;

export const selectFilteredPosts = createSelector(
  [selectPosts, selectActiveTab],
  (posts, activeTab) => posts.filter(post => post.type === activeTab)
);

export const selectLikedPosts = createSelector(
  selectPosts,
  (posts) => posts.filter(p => p.isLiked)
);

export const selectPostById = (postId: string) => createSelector(
  selectPosts,
  (posts) => posts.find(p => p.id === postId)
);

// ============ CHAT SELECTORS ============
export const selectChat = (state: RootState) => state.chat;
export const selectMessages = (state: RootState) => state.chat.messages;
export const selectIsTyping = (state: RootState) => state.chat.isTyping;
export const selectUserScore = (state: RootState) => state.chat.userScore;
export const selectGeminiHistory = (state: RootState) => state.chat.geminiHistory;
export const selectNeedsFollowUp = (state: RootState) => state.chat.needsFollowUp;

export const selectUserCategory = createSelector(
  selectUserScore,
  (score) => score.category
);

export const selectUserEmotionalState = createSelector(
  selectUserScore,
  (score) => score.emotionalState
);

export const selectRecentTopics = createSelector(
  selectUserScore,
  (score) => score.recentTopics
);

// ============ COMPLAINT SELECTORS ============
export const selectComplaint = (state: RootState) => state.complaint;
export const selectComplaints = (state: RootState) => state.complaint.complaints;
export const selectComplaintFilters = (state: RootState) => state.complaint.filters;
export const selectComplaintStats = (state: RootState) => state.complaint.stats;
export const selectComplaintDraft = (state: RootState) => state.complaint.draft;
export const selectCurrentComplaint = (state: RootState) => state.complaint.currentComplaint;
export const selectIsSubmitting = (state: RootState) => state.complaint.isSubmitting;

export const selectFilteredComplaints = createSelector(
  [selectComplaints, selectComplaintFilters],
  (complaints, filters) => {
    let result = complaints;
    
    if (filters.status !== 'all') {
      result = result.filter(c => c.status === filters.status);
    }
    if (filters.type !== 'all') {
      result = result.filter(c => c.type === filters.type);
    }
    if (filters.severity !== 'all') {
      result = result.filter(c => c.severity === filters.severity);
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query)
      );
    }
    
    return result;
  }
);

export const selectPendingComplaints = createSelector(
  selectComplaints,
  (complaints) => complaints.filter(c => c.status === 'pending')
);

export const selectResolvedComplaints = createSelector(
  selectComplaints,
  (complaints) => complaints.filter(c => c.status === 'resolved' || c.status === 'closed')
);

export const selectComplaintById = (id: string) => createSelector(
  selectComplaints,
  (complaints) => complaints.find(c => c.id === id)
);

// ============ NOTIFICATION SELECTORS ============
export const selectNotification = (state: RootState) => state.notification;
export const selectNotifications = (state: RootState) => state.notification.notifications;
export const selectUnreadNotificationCount = (state: RootState) => state.notification.unreadCount;
export const selectNotificationPreferences = (state: RootState) => state.notification.preferences;

export const selectUnreadNotifications = createSelector(
  selectNotifications,
  (notifications) => notifications.filter(n => !n.isRead)
);

export const selectNotificationsByType = (type: string) => createSelector(
  selectNotifications,
  (notifications) => notifications.filter(n => n.type === type)
);

export const selectUrgentNotifications = createSelector(
  selectNotifications,
  (notifications) => notifications.filter(n => n.priority === 'urgent' || n.priority === 'high')
);

// ============ APP SELECTORS ============
export const selectApp = (state: RootState) => state.app;
export const selectAppStatus = (state: RootState) => state.app.status;
export const selectConnectionStatus = (state: RootState) => state.app.connectionStatus;
export const selectIsOnline = (state: RootState) => state.app.connectionStatus === 'online';
export const selectAppFeatures = (state: RootState) => state.app.features;
export const selectAppConfig = (state: RootState) => state.app.config;
export const selectToasts = (state: RootState) => state.app.toasts;
export const selectModals = (state: RootState) => state.app.modals;
export const selectGlobalLoading = (state: RootState) => state.app.globalLoading;

export const selectIsFeatureEnabled = (feature: keyof RootState['app']['features']) => 
  (state: RootState) => state.app.features[feature];

// ============ COMBINED SELECTORS ============
export const selectTotalUnreadCount = createSelector(
  [selectUnreadNotificationCount, selectUnreadAlertsCount],
  (notifications, alerts) => notifications + alerts
);

export const selectUserFullProfile = createSelector(
  [selectUser, selectProfile, selectUserScore],
  (user, profile, score) => ({
    ...user,
    phone: profile.phone,
    location: profile.location,
    dateOfBirth: profile.dateOfBirth,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    safetyScore: score.score,
    category: score.category,
  })
);

export const selectIsAppReady = createSelector(
  [selectApp, selectAuth],
  (app, auth) => app.isInitialized && (auth.isAuthenticated || !auth.isLoading)
);
