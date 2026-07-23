// src/lib/api/auth.service.ts
import apiClient from '@/src/lib/api/client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: 'super_admin' | 'admin' | 'staff';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      _id: string;
      user_id: string;
      name: string;
      email: string;
      phone?: string;
      role: 'super_admin' | 'admin' | 'staff';
      is_active: boolean;
      full_name?: string;
    };
    accessToken: string;
    refreshToken: string;
  };
}

export interface User {
  _id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'staff';
  is_active: boolean;
  full_name?: string;
}

export const authService = {
  // Login
  login: (credentials: LoginCredentials) =>
    apiClient.post<AuthResponse>('/auth/login', credentials),

  // Register
  register: (data: RegisterData) =>
    apiClient.post<AuthResponse>('/auth/register', data),

  // Get current user
  getMe: () =>
    apiClient.get<{ success: boolean; data: User }>('/auth/me'),

  // Logout
  logout: () =>
    apiClient.post('/auth/logout'),

  // Refresh token
  refreshToken: () =>
    apiClient.post<{ success: boolean; data: { accessToken: string } }>('/auth/refresh'),
};