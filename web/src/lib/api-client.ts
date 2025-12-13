import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                refreshToken,
              });

              const responseData = response.data.data || response.data;
              const { accessToken, refreshToken: newRefreshToken } = responseData;
              
              localStorage.setItem('accessToken', accessToken);
              if (newRefreshToken) {
                localStorage.setItem('refreshToken', newRefreshToken);
              }

              // Update zustand store
              if (typeof window !== 'undefined') {
                const { useAuthStore } = await import('@/store/auth-store');
                useAuthStore.getState().updateTokens(accessToken, newRefreshToken || refreshToken);
              }

              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            if (typeof window !== 'undefined') {
              const { useAuthStore } = await import('@/store/auth-store');
              useAuthStore.getState().clearAuth();
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async registerParent(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const response = await this.client.post('/auth/register', data);
    return response.data;
  }

  async login(data: { email: string; password: string }) {
    const response = await this.client.post('/auth/login', data);
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/auth/logout');
    return response.data;
  }

  async getMe() {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  async createChild(data: {
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
  }) {
    const response = await this.client.post('/auth/child', data);
    return response.data;
  }

  // Scan endpoints
  async scanText(data: { content: string; source?: string; platform?: string }) {
    const response = await this.client.post('/scan/text', data);
    return response.data;
  }

  async scanImage(data: { imageUrl?: string; imageData?: string; source?: string }) {
    const response = await this.client.post('/scan/image', data);
    return response.data;
  }

  async getScanHistory(params?: {
    page?: number;
    limit?: number;
    isAbusive?: boolean;
    startDate?: string;
    endDate?: string;
  }) {
    const response = await this.client.get('/scan/history', { params });
    return response.data;
  }

  async getScanById(id: string) {
    const response = await this.client.get(`/scan/${id}`);
    return response.data;
  }

  // Alert endpoints
  async getAlerts(params?: {
    page?: number;
    limit?: number;
    severity?: string;
    status?: string;
    childId?: string;
  }) {
    const response = await this.client.get('/alerts', { params });
    return response.data;
  }

  async getAlertById(id: string) {
    const response = await this.client.get(`/alerts/${id}`);
    return response.data;
  }

  async updateAlertStatus(id: string, status: string) {
    const response = await this.client.put(`/alerts/${id}/status`, { status });
    return response.data;
  }

  async acknowledgeAlert(id: string) {
    const response = await this.client.put(`/alerts/${id}/acknowledge`);
    return response.data;
  }

  async resolveAlert(id: string, notes?: string) {
    const response = await this.client.put(`/alerts/${id}/resolve`, { notes });
    return response.data;
  }

  async getAlertStats(childId?: string) {
    const response = await this.client.get('/alerts/stats', {
      params: childId ? { childId } : {},
    });
    return response.data;
  }

  // Parent endpoints
  async getChildren() {
    const response = await this.client.get('/parent/children');
    return response.data;
  }

  async getChildById(id: string) {
    const response = await this.client.get(`/parent/children/${id}`);
    return response.data;
  }

  async updateChild(id: string, data: any) {
    const response = await this.client.put(`/parent/children/${id}`, data);
    return response.data;
  }

  async getChildScanHistory(id: string, params?: any) {
    const response = await this.client.get(`/parent/children/${id}/scan-history`, { params });
    return response.data;
  }

  async getDashboardSummary() {
    const response = await this.client.get('/parent/dashboard');
    return response.data;
  }

  async getActivityFeed(params?: { page?: number; limit?: number }) {
    // Activity feed uses the incidents endpoint
    const response = await this.client.get('/parent/incidents', { params });
    return response.data;
  }

  async getIncidents(params?: any) {
    const response = await this.client.get('/parent/incidents', { params });
    return response.data;
  }

  // Child endpoints
  async getChildProfile() {
    const response = await this.client.get('/child/profile');
    return response.data;
  }

  async updateChildProfile(data: { firstName?: string; lastName?: string }) {
    const response = await this.client.put('/child/profile', data);
    return response.data;
  }

  async getChildOwnScanHistory(params?: any) {
    const response = await this.client.get('/child/scan-history', { params });
    return response.data;
  }
}

export const apiClient = new ApiClient();
