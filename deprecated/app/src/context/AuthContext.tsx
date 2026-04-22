import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'child' | 'user';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // BACKEND TODO: Check for existing auth token on app launch
    // GET /api/auth/verify-token
    // If token is valid, set user data
    // Use expo-secure-store to retrieve token
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Simulate checking auth status
      // Replace with actual API call
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // BACKEND TODO: Implement login API call
    // POST /api/auth/login
    // Request body: { email, password }
    // Response: { token, user }
    // Store token in secure storage
    // Set user state
    setUser({
      id: '1',
      name: 'James',
      email,
      role: 'user',
    });
  };

  const signup = async (name: string, email: string, password: string) => {
    // BACKEND TODO: Implement signup API call
    // POST /api/auth/signup
    // Request body: { name, email, password }
    // Response: { token, user }
    // Store token in secure storage
    // Set user state
    setUser({
      id: '1',
      name,
      email,
      role: 'user',
    });
  };

  const logout = async () => {
    // BACKEND TODO: Implement logout
    // Clear auth token from secure storage
    // POST /api/auth/logout (optional)
    // Clear user state
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
