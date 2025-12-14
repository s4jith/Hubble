import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ProfileSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  reduceMotion: boolean;
  highContrast: boolean;
}

interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'family';
  showOnlineStatus: boolean;
  allowDirectMessages: boolean;
  showActivityStatus: boolean;
  shareDataForAnalytics: boolean;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  loginAlerts: boolean;
  trustedDevices: string[];
  lastPasswordChange: string | null;
}

interface ConnectedAccount {
  id: string;
  platform: 'instagram' | 'twitter' | 'facebook' | 'tiktok' | 'snapchat' | 'youtube';
  username: string;
  isConnected: boolean;
  connectedAt: string;
  lastSynced?: string;
  monitoringEnabled: boolean;
}

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'parent' | 'child' | 'guardian';
  status: 'active' | 'pending' | 'inactive';
  addedAt: string;
  permissions: {
    canViewReports: boolean;
    canViewActivity: boolean;
    canReceiveAlerts: boolean;
  };
}

interface ActivityLog {
  id: string;
  type: 'login' | 'profile_update' | 'password_change' | 'report_filed' | 'settings_change' | 'device_added';
  description: string;
  timestamp: string;
  device?: string;
  location?: string;
  ipAddress?: string;
}

interface ProfileState {
  // Extended profile info
  phone: string;
  location: string;
  dateOfBirth: string;
  bio: string;
  avatarUrl: string | null;
  
  // Settings
  appSettings: ProfileSettings;
  privacySettings: PrivacySettings;
  securitySettings: SecuritySettings;
  
  // Connected accounts for monitoring
  connectedAccounts: ConnectedAccount[];
  
  // Family circle
  familyMembers: FamilyMember[];
  pendingInvites: FamilyMember[];
  
  // Activity history
  activityLog: ActivityLog[];
  
  // UI states
  isLoading: boolean;
  isSaving: boolean;
  isEditing: boolean;
  activeSettingsSection: string | null;
  
  // Messages
  error: string | null;
  successMessage: string | null;
}

const defaultAppSettings: ProfileSettings = {
  theme: 'system',
  language: 'en',
  fontSize: 'medium',
  reduceMotion: false,
  highContrast: false,
};

const defaultPrivacySettings: PrivacySettings = {
  profileVisibility: 'family',
  showOnlineStatus: true,
  allowDirectMessages: true,
  showActivityStatus: true,
  shareDataForAnalytics: true,
};

const defaultSecuritySettings: SecuritySettings = {
  twoFactorEnabled: false,
  biometricEnabled: false,
  loginAlerts: true,
  trustedDevices: [],
  lastPasswordChange: null,
};

const initialState: ProfileState = {
  phone: '',
  location: '',
  dateOfBirth: '',
  bio: '',
  avatarUrl: null,
  appSettings: defaultAppSettings,
  privacySettings: defaultPrivacySettings,
  securitySettings: defaultSecuritySettings,
  connectedAccounts: [],
  familyMembers: [],
  pendingInvites: [],
  activityLog: [],
  isLoading: false,
  isSaving: false,
  isEditing: false,
  activeSettingsSection: null,
  error: null,
  successMessage: null,
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    // Profile info
    setProfileInfo: (state, action: PayloadAction<{
      phone?: string;
      location?: string;
      dateOfBirth?: string;
      bio?: string;
      avatarUrl?: string | null;
    }>) => {
      if (action.payload.phone !== undefined) state.phone = action.payload.phone;
      if (action.payload.location !== undefined) state.location = action.payload.location;
      if (action.payload.dateOfBirth !== undefined) state.dateOfBirth = action.payload.dateOfBirth;
      if (action.payload.bio !== undefined) state.bio = action.payload.bio;
      if (action.payload.avatarUrl !== undefined) state.avatarUrl = action.payload.avatarUrl;
    },
    updateAvatar: (state, action: PayloadAction<string>) => {
      state.avatarUrl = action.payload;
    },

    // App settings
    setAppSettings: (state, action: PayloadAction<ProfileSettings>) => {
      state.appSettings = action.payload;
    },
    updateAppSetting: (state, action: PayloadAction<Partial<ProfileSettings>>) => {
      state.appSettings = { ...state.appSettings, ...action.payload };
    },
    setTheme: (state, action: PayloadAction<ProfileSettings['theme']>) => {
      state.appSettings.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.appSettings.language = action.payload;
    },

    // Privacy settings
    setPrivacySettings: (state, action: PayloadAction<PrivacySettings>) => {
      state.privacySettings = action.payload;
    },
    updatePrivacySetting: (state, action: PayloadAction<Partial<PrivacySettings>>) => {
      state.privacySettings = { ...state.privacySettings, ...action.payload };
    },

    // Security settings
    setSecuritySettings: (state, action: PayloadAction<SecuritySettings>) => {
      state.securitySettings = action.payload;
    },
    updateSecuritySetting: (state, action: PayloadAction<Partial<SecuritySettings>>) => {
      state.securitySettings = { ...state.securitySettings, ...action.payload };
    },
    enableTwoFactor: (state) => {
      state.securitySettings.twoFactorEnabled = true;
    },
    disableTwoFactor: (state) => {
      state.securitySettings.twoFactorEnabled = false;
    },
    enableBiometric: (state) => {
      state.securitySettings.biometricEnabled = true;
    },
    disableBiometric: (state) => {
      state.securitySettings.biometricEnabled = false;
    },
    addTrustedDevice: (state, action: PayloadAction<string>) => {
      if (!state.securitySettings.trustedDevices.includes(action.payload)) {
        state.securitySettings.trustedDevices.push(action.payload);
      }
    },
    removeTrustedDevice: (state, action: PayloadAction<string>) => {
      state.securitySettings.trustedDevices = state.securitySettings.trustedDevices.filter(
        d => d !== action.payload
      );
    },

    // Connected accounts
    setConnectedAccounts: (state, action: PayloadAction<ConnectedAccount[]>) => {
      state.connectedAccounts = action.payload;
    },
    addConnectedAccount: (state, action: PayloadAction<ConnectedAccount>) => {
      const existing = state.connectedAccounts.findIndex(a => a.platform === action.payload.platform);
      if (existing !== -1) {
        state.connectedAccounts[existing] = action.payload;
      } else {
        state.connectedAccounts.push(action.payload);
      }
    },
    removeConnectedAccount: (state, action: PayloadAction<string>) => {
      state.connectedAccounts = state.connectedAccounts.filter(a => a.id !== action.payload);
    },
    toggleAccountMonitoring: (state, action: PayloadAction<string>) => {
      const account = state.connectedAccounts.find(a => a.id === action.payload);
      if (account) {
        account.monitoringEnabled = !account.monitoringEnabled;
      }
    },
    updateAccountSyncTime: (state, action: PayloadAction<string>) => {
      const account = state.connectedAccounts.find(a => a.id === action.payload);
      if (account) {
        account.lastSynced = new Date().toISOString();
      }
    },

    // Family members
    setFamilyMembers: (state, action: PayloadAction<FamilyMember[]>) => {
      state.familyMembers = action.payload;
    },
    addFamilyMember: (state, action: PayloadAction<FamilyMember>) => {
      state.familyMembers.push(action.payload);
    },
    updateFamilyMember: (state, action: PayloadAction<FamilyMember>) => {
      const index = state.familyMembers.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.familyMembers[index] = action.payload;
      }
    },
    removeFamilyMember: (state, action: PayloadAction<string>) => {
      state.familyMembers = state.familyMembers.filter(m => m.id !== action.payload);
    },
    updateFamilyMemberPermissions: (state, action: PayloadAction<{
      id: string;
      permissions: Partial<FamilyMember['permissions']>;
    }>) => {
      const member = state.familyMembers.find(m => m.id === action.payload.id);
      if (member) {
        member.permissions = { ...member.permissions, ...action.payload.permissions };
      }
    },

    // Pending invites
    setPendingInvites: (state, action: PayloadAction<FamilyMember[]>) => {
      state.pendingInvites = action.payload;
    },
    addPendingInvite: (state, action: PayloadAction<FamilyMember>) => {
      state.pendingInvites.push(action.payload);
    },
    removePendingInvite: (state, action: PayloadAction<string>) => {
      state.pendingInvites = state.pendingInvites.filter(i => i.id !== action.payload);
    },
    acceptInvite: (state, action: PayloadAction<string>) => {
      const invite = state.pendingInvites.find(i => i.id === action.payload);
      if (invite) {
        invite.status = 'active';
        state.familyMembers.push(invite);
        state.pendingInvites = state.pendingInvites.filter(i => i.id !== action.payload);
      }
    },

    // Activity log
    setActivityLog: (state, action: PayloadAction<ActivityLog[]>) => {
      state.activityLog = action.payload;
    },
    addActivityLog: (state, action: PayloadAction<ActivityLog>) => {
      state.activityLog.unshift(action.payload);
      // Keep only last 100 activities
      if (state.activityLog.length > 100) {
        state.activityLog = state.activityLog.slice(0, 100);
      }
    },
    clearActivityLog: (state) => {
      state.activityLog = [];
    },

    // UI states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setSaving: (state, action: PayloadAction<boolean>) => {
      state.isSaving = action.payload;
    },
    setEditing: (state, action: PayloadAction<boolean>) => {
      state.isEditing = action.payload;
    },
    setActiveSettingsSection: (state, action: PayloadAction<string | null>) => {
      state.activeSettingsSection = action.payload;
    },

    // Messages
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSuccessMessage: (state, action: PayloadAction<string | null>) => {
      state.successMessage = action.payload;
    },
    clearMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },

    // Save profile
    saveProfileStart: (state) => {
      state.isSaving = true;
      state.error = null;
    },
    saveProfileSuccess: (state) => {
      state.isSaving = false;
      state.isEditing = false;
      state.successMessage = 'Profile updated successfully!';
    },
    saveProfileFailure: (state, action: PayloadAction<string>) => {
      state.isSaving = false;
      state.error = action.payload;
    },

    // Reset
    resetProfileSettings: (state) => {
      state.appSettings = defaultAppSettings;
      state.privacySettings = defaultPrivacySettings;
      state.securitySettings = defaultSecuritySettings;
    },
    resetProfile: () => initialState,
  },
});

export const {
  setProfileInfo,
  updateAvatar,
  setAppSettings,
  updateAppSetting,
  setTheme,
  setLanguage,
  setPrivacySettings,
  updatePrivacySetting,
  setSecuritySettings,
  updateSecuritySetting,
  enableTwoFactor,
  disableTwoFactor,
  enableBiometric,
  disableBiometric,
  addTrustedDevice,
  removeTrustedDevice,
  setConnectedAccounts,
  addConnectedAccount,
  removeConnectedAccount,
  toggleAccountMonitoring,
  updateAccountSyncTime,
  setFamilyMembers,
  addFamilyMember,
  updateFamilyMember,
  removeFamilyMember,
  updateFamilyMemberPermissions,
  setPendingInvites,
  addPendingInvite,
  removePendingInvite,
  acceptInvite,
  setActivityLog,
  addActivityLog,
  clearActivityLog,
  setLoading,
  setSaving,
  setEditing,
  setActiveSettingsSection,
  setError,
  setSuccessMessage,
  clearMessages,
  saveProfileStart,
  saveProfileSuccess,
  saveProfileFailure,
  resetProfileSettings,
  resetProfile,
} = profileSlice.actions;

export type { 
  ProfileSettings, 
  PrivacySettings, 
  SecuritySettings, 
  ConnectedAccount, 
  FamilyMember, 
  ActivityLog 
};
export default profileSlice.reducer;
