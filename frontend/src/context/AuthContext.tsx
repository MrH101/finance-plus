import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

interface User {
  id: number;
  email: string;
  role: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (data: {
    username: string;
    email: string;
    phone: string;
    password: string;
    password2: string;
    role: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Helper: Set access and refresh tokens everywhere
  const setTokens = (access: string | null, refresh: string | null) => {
    if (access) {
      localStorage.setItem('token', access);
      api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      console.log('Access token set:', access);
    } else {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      console.log('Access token cleared');
    }
    if (refresh) {
      localStorage.setItem('refreshToken', refresh);
    } else {
      localStorage.removeItem('refreshToken');
    }
  };

  // On mount, check for token and fetch user
  useEffect(() => {
    const access = localStorage.getItem('token');
    const refresh = localStorage.getItem('refreshToken');
    if (access) {
      setTokens(access, refresh);
      // Fetch user profile with token
      api.get('/users/me/')
        .then((userRes) => {
          const raw = userRes.data as any;
          const backendRole = (raw?.role || raw?.user_role || raw?.user?.role || '').toString().trim().toLowerCase();
          const normalizedRole = backendRole === 'employer' ? 'manager' : backendRole;
          const normalizedUser = { ...raw, role: normalizedRole } as any;
          setUser(normalizedUser);
          setIsAuthenticated(true);
        })
        .catch(() => {
          setUser(null);
          setIsAuthenticated(false);
          setTokens(null, null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  // Login function: use JWT token endpoint
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post('/token/', { username: email, password });
      const { access, refresh } = res.data;
      if (!access || !refresh) {
        throw new Error('No tokens received from server');
      }
      setTokens(access, refresh);
      // Fetch user profile with new token
      const userRes = await api.get('/users/me/');
      const raw = userRes.data as any;
      const backendRole = (raw?.role || raw?.user_role || raw?.user?.role || '').toString().trim().toLowerCase();
      const normalizedRole = backendRole === 'employer' ? 'manager' : backendRole;
      const normalizedUser = { ...raw, role: normalizedRole } as any;
      setUser(normalizedUser);
      setIsAuthenticated(true);
      toast.success('Logged in!');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Login failed');
      toast.error(err.response?.data?.detail || err.response?.data?.error || 'Login failed');
      setUser(null);
      setIsAuthenticated(false);
      setTokens(null, null);
    } finally {
      setIsLoading(false);
    }
  };

  
  // Signup function: always use backend token after auto-login
  const signup = async (data: {
    username: string;
    email: string;
    phone: string;
    password: string;
    password2: string;
    role: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/employer-signup/', data);
      toast.success('Signup successful! Logging you in...');
      // Auto-login after signup
      await login(data.email, data.password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed');
      toast.error(err.response?.data?.error || 'Signup failed');
      setUser(null);
      setIsAuthenticated(false);
      setTokens(null, null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setTokens(null, null);
    toast('Logged out');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, error, login, logout, signup }}>
      {isLoading ? <LoadingSpinner /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

