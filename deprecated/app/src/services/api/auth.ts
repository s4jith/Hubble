import { apiClient, tokenManager } from './client';

/**
 * Auth API Types
 */
export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    role: 'parent' | 'child' | 'admin';
  };
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'parent' | 'child' | 'admin';
  dateOfBirth?: string;
  isVerified: boolean;
  createdAt: string;
}

/**
 * Auth API Service
 */
export const authApi = {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials, false);
    await tokenManager.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  /**
   * Register new user (parent)
   */
  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register-parent', data, false);
    await tokenManager.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      await tokenManager.clearTokens();
    }
  },

  /**
   * Refresh token
   */
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = await tokenManager.getRefreshToken();
    const response = await apiClient.post<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { refreshToken },
      false
    );
    await tokenManager.setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/auth/me');
  },

  /**
   * Update user profile
   */
  async updateProfile(data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    dateOfBirth?: string;
  }): Promise<UserProfile> {
    return apiClient.put<UserProfile>('/users/profile', data);
  },

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await tokenManager.getAccessToken();
    return !!token;
  },
};
