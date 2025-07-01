"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '@/utils/api';

type User = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  phoneNumber?: string;
  position?: string;
  department?: string;
  address?: string;
  employeeId?: string;
  gender?: number;
  dateOfBirth?: string;
  status?: 'active' | 'inactive' | 'suspended';
  group?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type RegisterData = {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  position: string;
  department: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();

  // Check if user is already logged in on mount
  useEffect(() => {
    const storedToken = Cookies.get('token');
    if (storedToken) {
      setToken(storedToken);
      fetchCurrentUser();
    } else {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (err) {
      console.error('Error fetching user data:', err);
      // Token invalid, clear it
      Cookies.remove('token');
      setToken(null);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  };

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/login', { username, password });
      const data = response.data;

      setUser(data.user);
      setToken(data.token);
      // Set token in cookie with httpOnly flag
      Cookies.set('token', data.token, {
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });

      // Check for callback URL in query params
      const urlParams = new URLSearchParams(window.location.search);
      const callbackUrl = urlParams.get('callbackUrl');
      router.push(callbackUrl || '/');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || 'Có lỗi xảy ra khi đăng nhập');
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Có lỗi xảy ra khi đăng nhập');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/register', userData);
      const data = response.data;

      setUser(data.user);
      setToken(data.token);
      // Set token in cookie with httpOnly flag
      Cookies.set('token', data.token, {
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      });
      router.push('/');
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An error occurred during registration');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    setToken(null);
    router.push('/auth/signin');
  };

  const checkAuth = async (): Promise<boolean> => {
    const storedToken = Cookies.get('token');
    if (!storedToken) return false;

    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      return true;
    } catch (error) {
      console.error('Error checking auth status:', error);
      // Token is invalid
      Cookies.remove('token');
      setToken(null);
      setUser(null);
      return false;
    }
  };

  const value = {
    user,
    token,
    loading,
    isInitialized,
    error,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 