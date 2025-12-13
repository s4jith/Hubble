'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/lib/api-client';

export function useAuthHydration() {
  const { setAuth, clearAuth, setHydrating, isHydrating } = useAuthStore();
  const hasHydrated = useRef(false);

  useEffect(() => {
    // Only hydrate once
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    const hydrateAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!accessToken || !refreshToken) {
        setHydrating(false);
        return;
      }

      try {
        // Validate token by fetching user profile
        const response = await apiClient.getMe();
        if (response.success && response.data?.user) {
          setAuth(response.data.user, accessToken, refreshToken);
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error('Auth hydration failed:', error);
        clearAuth();
      } finally {
        setHydrating(false);
      }
    };

    hydrateAuth();
  }, [setAuth, clearAuth, setHydrating]);

  return { isHydrating };
}
