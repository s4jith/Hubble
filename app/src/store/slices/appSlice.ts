import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ConnectionStatus = 'online' | 'offline' | 'connecting';
type AppStatus = 'idle' | 'loading' | 'error' | 'maintenance';

interface AppVersion {
  current: string;
  latest: string;
  updateAvailable: boolean;
  updateRequired: boolean;
  releaseNotes?: string;
}

interface FeatureFlags {
  chatbotEnabled: boolean;
  feedEnabled: boolean;
  reportingEnabled: boolean;
  familyCircleEnabled: boolean;
  socialMonitoringEnabled: boolean;
  pushNotificationsEnabled: boolean;
  analyticsEnabled: boolean;
  betaFeatures: boolean;
}

interface AppConfig {
  apiBaseUrl: string;
  socketUrl: string;
  maxUploadSize: number;
  supportedImageFormats: string[];
  supportedVideoFormats: string[];
  sessionTimeout: number;
  helplineNumber: string;
  emergencyNumber: string;
}

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onPress: string; // Route or action name
  };
}

interface Modal {
  id: string;
  type: 'confirm' | 'alert' | 'prompt' | 'custom';
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  component?: string;
  data?: Record<string, any>;
}

interface AppState {
  // App status
  status: AppStatus;
  connectionStatus: ConnectionStatus;
  isInitialized: boolean;
  isFirstLaunch: boolean;
  
  // Version info
  version: AppVersion;
  
  // Feature flags
  features: FeatureFlags;
  
  // Configuration
  config: AppConfig;
  
  // UI state
  currentRoute: string | null;
  previousRoute: string | null;
  isKeyboardVisible: boolean;
  keyboardHeight: number;
  screenDimensions: {
    width: number;
    height: number;
  };
  orientation: 'portrait' | 'landscape';
  
  // Toast/notifications queue
  toasts: ToastMessage[];
  
  // Modal stack
  modals: Modal[];
  
  // Global loading states
  globalLoading: boolean;
  loadingMessage: string | null;
  
  // Error state
  globalError: string | null;
  lastError: {
    code: string;
    message: string;
    timestamp: string;
  } | null;
  
  // Deep linking
  pendingDeepLink: string | null;
  
  // App lifecycle
  lastActiveAt: string | null;
  backgroundedAt: string | null;
  sessionStartedAt: string | null;
}

const defaultConfig: AppConfig = {
  apiBaseUrl: 'https://api.hubble.app',
  socketUrl: 'wss://socket.hubble.app',
  maxUploadSize: 10 * 1024 * 1024, // 10MB
  supportedImageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  supportedVideoFormats: ['mp4', 'mov', 'avi'],
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  helplineNumber: '1930',
  emergencyNumber: '112',
};

const defaultFeatures: FeatureFlags = {
  chatbotEnabled: true,
  feedEnabled: true,
  reportingEnabled: true,
  familyCircleEnabled: true,
  socialMonitoringEnabled: true,
  pushNotificationsEnabled: true,
  analyticsEnabled: true,
  betaFeatures: false,
};

const initialState: AppState = {
  status: 'idle',
  connectionStatus: 'online',
  isInitialized: false,
  isFirstLaunch: true,
  version: {
    current: '1.0.0',
    latest: '1.0.0',
    updateAvailable: false,
    updateRequired: false,
  },
  features: defaultFeatures,
  config: defaultConfig,
  currentRoute: null,
  previousRoute: null,
  isKeyboardVisible: false,
  keyboardHeight: 0,
  screenDimensions: {
    width: 0,
    height: 0,
  },
  orientation: 'portrait',
  toasts: [],
  modals: [],
  globalLoading: false,
  loadingMessage: null,
  globalError: null,
  lastError: null,
  pendingDeepLink: null,
  lastActiveAt: null,
  backgroundedAt: null,
  sessionStartedAt: null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    // App initialization
    initializeApp: (state) => {
      state.status = 'loading';
    },
    appInitialized: (state) => {
      state.isInitialized = true;
      state.status = 'idle';
      state.sessionStartedAt = new Date().toISOString();
    },
    setFirstLaunch: (state, action: PayloadAction<boolean>) => {
      state.isFirstLaunch = action.payload;
    },

    // Status
    setAppStatus: (state, action: PayloadAction<AppStatus>) => {
      state.status = action.payload;
    },
    setConnectionStatus: (state, action: PayloadAction<ConnectionStatus>) => {
      state.connectionStatus = action.payload;
    },

    // Version
    setVersion: (state, action: PayloadAction<AppVersion>) => {
      state.version = action.payload;
    },
    checkForUpdate: (state) => {
      // This would trigger an async check
    },
    setUpdateAvailable: (state, action: PayloadAction<{ latest: string; required: boolean; notes?: string }>) => {
      state.version.latest = action.payload.latest;
      state.version.updateAvailable = true;
      state.version.updateRequired = action.payload.required;
      state.version.releaseNotes = action.payload.notes;
    },

    // Feature flags
    setFeatures: (state, action: PayloadAction<FeatureFlags>) => {
      state.features = action.payload;
    },
    updateFeature: (state, action: PayloadAction<Partial<FeatureFlags>>) => {
      state.features = { ...state.features, ...action.payload };
    },
    enableBetaFeatures: (state) => {
      state.features.betaFeatures = true;
    },
    disableBetaFeatures: (state) => {
      state.features.betaFeatures = false;
    },

    // Configuration
    setConfig: (state, action: PayloadAction<Partial<AppConfig>>) => {
      state.config = { ...state.config, ...action.payload };
    },

    // Navigation tracking
    setCurrentRoute: (state, action: PayloadAction<string>) => {
      state.previousRoute = state.currentRoute;
      state.currentRoute = action.payload;
    },

    // Keyboard
    setKeyboardVisible: (state, action: PayloadAction<{ visible: boolean; height?: number }>) => {
      state.isKeyboardVisible = action.payload.visible;
      state.keyboardHeight = action.payload.height || 0;
    },

    // Screen dimensions
    setScreenDimensions: (state, action: PayloadAction<{ width: number; height: number }>) => {
      state.screenDimensions = action.payload;
      state.orientation = action.payload.width > action.payload.height ? 'landscape' : 'portrait';
    },

    // Toasts
    showToast: (state, action: PayloadAction<Omit<ToastMessage, 'id'>>) => {
      const toast: ToastMessage = {
        ...action.payload,
        id: `toast_${Date.now()}`,
      };
      state.toasts.push(toast);
    },
    dismissToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },

    // Modals
    showModal: (state, action: PayloadAction<Omit<Modal, 'id'>>) => {
      const modal: Modal = {
        ...action.payload,
        id: `modal_${Date.now()}`,
      };
      state.modals.push(modal);
    },
    dismissModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(m => m.id !== action.payload);
    },
    dismissAllModals: (state) => {
      state.modals = [];
    },

    // Global loading
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
      if (!action.payload) {
        state.loadingMessage = null;
      }
    },
    setLoadingMessage: (state, action: PayloadAction<string | null>) => {
      state.loadingMessage = action.payload;
    },
    showLoading: (state, action: PayloadAction<string | undefined>) => {
      state.globalLoading = true;
      state.loadingMessage = action.payload || null;
    },
    hideLoading: (state) => {
      state.globalLoading = false;
      state.loadingMessage = null;
    },

    // Error handling
    setGlobalError: (state, action: PayloadAction<string | null>) => {
      state.globalError = action.payload;
      if (action.payload) {
        state.lastError = {
          code: 'GLOBAL_ERROR',
          message: action.payload,
          timestamp: new Date().toISOString(),
        };
      }
    },
    setLastError: (state, action: PayloadAction<{ code: string; message: string }>) => {
      state.lastError = {
        ...action.payload,
        timestamp: new Date().toISOString(),
      };
    },
    clearError: (state) => {
      state.globalError = null;
    },

    // Deep linking
    setPendingDeepLink: (state, action: PayloadAction<string | null>) => {
      state.pendingDeepLink = action.payload;
    },
    clearPendingDeepLink: (state) => {
      state.pendingDeepLink = null;
    },

    // App lifecycle
    appBecameActive: (state) => {
      state.lastActiveAt = new Date().toISOString();
      state.backgroundedAt = null;
    },
    appBecameBackground: (state) => {
      state.backgroundedAt = new Date().toISOString();
    },

    // Reset
    resetApp: () => initialState,
  },
});

export const {
  initializeApp,
  appInitialized,
  setFirstLaunch,
  setAppStatus,
  setConnectionStatus,
  setVersion,
  checkForUpdate,
  setUpdateAvailable,
  setFeatures,
  updateFeature,
  enableBetaFeatures,
  disableBetaFeatures,
  setConfig,
  setCurrentRoute,
  setKeyboardVisible,
  setScreenDimensions,
  showToast,
  dismissToast,
  clearToasts,
  showModal,
  dismissModal,
  dismissAllModals,
  setGlobalLoading,
  setLoadingMessage,
  showLoading,
  hideLoading,
  setGlobalError,
  setLastError,
  clearError,
  setPendingDeepLink,
  clearPendingDeepLink,
  appBecameActive,
  appBecameBackground,
  resetApp,
} = appSlice.actions;

export type { AppConfig, FeatureFlags, ToastMessage, Modal };
export default appSlice.reducer;
