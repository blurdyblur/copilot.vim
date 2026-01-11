import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthState } from '../types';
import api from '../utils/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    token: localStorage.getItem('token'),
    user: null,
    isAuthenticated: false
  });

  useEffect(() => {
    if (authState.token) {
      // Verify token and get user info
      api.get('/auth/verify')
        .then(response => {
          setAuthState(prev => ({
            ...prev,
            user: response.data.user,
            isAuthenticated: true
          }));
        })
        .catch(() => {
          localStorage.removeItem('token');
          setAuthState({
            token: null,
            user: null,
            isAuthenticated: false
          });
        });
    }
  }, [authState.token]);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    setAuthState({
      token,
      user,
      isAuthenticated: true
    });

    // Track analytics
    api.post('/analytics/track', { eventType: 'APP_OPENED' });
  };

  const register = async (email: string, password: string) => {
    const response = await api.post('/auth/register', { email, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    setAuthState({
      token,
      user,
      isAuthenticated: true
    });

    // Track analytics
    api.post('/analytics/track', { eventType: 'APP_OPENED' });
  };

  const loginAsGuest = async () => {
    const response = await api.post('/auth/guest');
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    setAuthState({
      token,
      user,
      isAuthenticated: true
    });

    // Track analytics
    api.post('/analytics/track', { eventType: 'APP_OPENED' });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false
    });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, register, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
