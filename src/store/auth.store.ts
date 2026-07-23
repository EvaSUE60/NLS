// src/store/auth.store.ts
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService, User } from '@/src/service/auth.service';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: 'super_admin' | 'admin' | 'staff' | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: { name: string; email: string; phone?: string; password: string; role?: 'super_admin' | 'admin' | 'staff' }) => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isAdmin: false,
      isSuperAdmin: false,
      role: null,

      // Login
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login({ email, password });
          const { user, accessToken } = response.data.data;

          localStorage.setItem('accessToken', accessToken);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isAdmin: user.role === 'admin' || user.role === 'super_admin',
            isSuperAdmin: user.role === 'super_admin',
            role: user.role,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Login failed. Please check your credentials.',
            isLoading: false,
          });
          throw error;
        }
      },

      // Logout
      logout: async () => {
        set({ isLoading: true });
        try {
          await authService.logout();
        } catch (_error) {
          // Ignore errors on logout
        } finally {
          localStorage.removeItem('accessToken');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isAdmin: false,
            isSuperAdmin: false,
            role: null,
            error: null,
          });
        }
      },

      // Register
      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          await authService.register(data);
          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Registration failed. Please try again.',
            isLoading: false,
          });
          throw error;
        }
      },

      // Get current user
      getCurrentUser: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authService.getMe();
          const user = response.data.data;
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isAdmin: user.role === 'admin' || user.role === 'super_admin',
            isSuperAdmin: user.role === 'super_admin',
            role: user.role,
          });
        } catch (_error) {
          localStorage.removeItem('accessToken');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            isAdmin: false,
            isSuperAdmin: false,
            role: null,
          });
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Set loading
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        isAdmin: state.isAdmin,
        isSuperAdmin: state.isSuperAdmin,
      }),
    }
  )
);