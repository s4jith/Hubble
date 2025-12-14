import { createAsyncThunk } from '@reduxjs/toolkit';
import { authApi, LoginRequest, SignupRequest } from '../../services/api';
import { tokenManager } from '../../services/api/client';

/**
 * Auth Thunks
 * Async actions for authentication
 */

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      return {
        user: {
          id: response.user.id,
          email: response.user.email,
          username: response.user.username,
          name: `${response.user.firstName} ${response.user.lastName}`,
          role: response.user.role,
          avatar: `https://i.pravatar.cc/150?u=${response.user.id}`,
        },
        token: response.accessToken,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const signupUser = createAsyncThunk(
  'auth/signup',
  async (data: SignupRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.signup(data);
      return {
        user: {
          id: response.user.id,
          email: response.user.email,
          username: response.user.username,
          name: `${response.user.firstName} ${response.user.lastName}`,
          role: response.user.role,
          avatar: `https://i.pravatar.cc/150?u=${response.user.id}`,
        },
        token: response.accessToken,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Signup failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      return true;
    } catch (error: any) {
      // Even if API fails, clear local tokens
      await tokenManager.clearTokens();
      return true;
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const profile = await authApi.getProfile();
      return {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        name: `${profile.firstName} ${profile.lastName}`,
        role: profile.role,
        avatar: `https://i.pravatar.cc/150?u=${profile.id}`,
        profile: {
          bio: '',
          location: '',
          website: '',
          joinedAt: profile.createdAt,
        },
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (
    data: { firstName?: string; lastName?: string; phone?: string; dateOfBirth?: string },
    { rejectWithValue }
  ) => {
    try {
      const profile = await authApi.updateProfile(data);
      return {
        id: profile.id,
        email: profile.email,
        username: profile.username,
        name: `${profile.firstName} ${profile.lastName}`,
        role: profile.role,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const isAuthenticated = await authApi.isAuthenticated();
      if (isAuthenticated) {
        const profile = await authApi.getProfile();
        return {
          isAuthenticated: true,
          user: {
            id: profile.id,
            email: profile.email,
            username: profile.username,
            name: `${profile.firstName} ${profile.lastName}`,
            role: profile.role,
            avatar: `https://i.pravatar.cc/150?u=${profile.id}`,
          },
        };
      }
      return { isAuthenticated: false, user: null };
    } catch (error: any) {
      return { isAuthenticated: false, user: null };
    }
  }
);
