import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loginUser, signupUser, logoutUser, fetchUserProfile, updateUserProfile as updateProfileThunk } from '../thunks/authThunks';

interface UserProfile {
  phone?: string;
  location?: string;
  dateOfBirth?: string;
  bio?: string;
  avatarUrl?: string;
}

interface UserStats {
  reportsFiled: number;
  reportsResolved: number;
  daysActive: number;
  safetyScore: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'parent' | 'child' | 'admin';
  profile?: UserProfile;
  stats?: UserStats;
  createdAt?: string;
  lastLogin?: string;
}

interface AuthError {
  code: string;
  message: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isProfileLoading: boolean;
  error: AuthError | null;
  passwordResetSent: boolean;
  sessionExpiresAt: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  isProfileLoading: false,
  error: null,
  passwordResetSent: false,
  sessionExpiresAt: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Login actions
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string; refreshToken?: string }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken || null;
      state.error = null;
      state.sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    },
    loginFailure: (state, action: PayloadAction<AuthError>) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.payload;
    },
    
    // Signup actions
    signupStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    signupSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },
    signupFailure: (state, action: PayloadAction<AuthError>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Logout
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      state.sessionExpiresAt = null;
    },

    // Password reset
    requestPasswordReset: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    passwordResetSuccess: (state) => {
      state.isLoading = false;
      state.passwordResetSent = true;
    },
    passwordResetFailure: (state, action: PayloadAction<AuthError>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    clearPasswordReset: (state) => {
      state.passwordResetSent = false;
    },

    // Profile updates
    updateProfileStart: (state) => {
      state.isProfileLoading = true;
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
      state.isProfileLoading = false;
    },
    updateUserProfile: (state, action: PayloadAction<UserProfile>) => {
      if (state.user) {
        state.user.profile = { ...state.user.profile, ...action.payload };
      }
      state.isProfileLoading = false;
    },
    updateUserStats: (state, action: PayloadAction<Partial<UserStats>>) => {
      if (state.user) {
        state.user.stats = { ...state.user.stats, ...action.payload } as UserStats;
      }
    },
    updateProfileFailure: (state, action: PayloadAction<AuthError>) => {
      state.isProfileLoading = false;
      state.error = action.payload;
    },

    // Token refresh
    refreshTokenSuccess: (state, action: PayloadAction<{ token: string; refreshToken?: string }>) => {
      state.token = action.payload.token;
      if (action.payload.refreshToken) {
        state.refreshToken = action.payload.refreshToken;
      }
      state.sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Session check
    setSessionExpired: (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.error = { code: 'SESSION_EXPIRED', message: 'Your session has expired. Please login again.' };
    },
  },
  extraReducers: (builder) => {
    builder
      // Login thunk
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user as any;
        state.token = action.payload.token;
        state.error = null;
        state.sessionExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = { code: 'LOGIN_FAILED', message: action.payload as string || 'Login failed' };
      })
      // Signup thunk
      .addCase(signupUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user as any;
        state.token = action.payload.token;
        state.error = null;
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = { code: 'SIGNUP_FAILED', message: action.payload as string || 'Signup failed' };
      })
      // Logout thunk
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
        state.sessionExpiresAt = null;
      })
      // Get profile thunk
      .addCase(fetchUserProfile.pending, (state) => {
        state.isProfileLoading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isProfileLoading = false;
        state.user = action.payload as any;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isProfileLoading = false;
        state.error = { code: 'PROFILE_FETCH_FAILED', message: action.payload as string };
      })
      // Update profile thunk
      .addCase(updateProfileThunk.pending, (state) => {
        state.isProfileLoading = true;
        state.error = null;
      })
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.isProfileLoading = false;
        if (state.user) {
          state.user = { ...state.user, ...action.payload } as any;
        }
      })
      .addCase(updateProfileThunk.rejected, (state, action) => {
        state.isProfileLoading = false;
        state.error = { code: 'PROFILE_UPDATE_FAILED', message: action.payload as string };
      });
  },
});

export const { 
  loginStart, 
  loginSuccess, 
  loginFailure, 
  signupStart,
  signupSuccess,
  signupFailure,
  logout, 
  requestPasswordReset,
  passwordResetSuccess,
  passwordResetFailure,
  clearPasswordReset,
  updateProfileStart,
  updateUser,
  updateUserProfile,
  updateUserStats,
  updateProfileFailure,
  refreshTokenSuccess,
  clearError,
  setSessionExpired,
} = authSlice.actions;

export type { User, UserProfile, UserStats, AuthError };
export default authSlice.reducer;
