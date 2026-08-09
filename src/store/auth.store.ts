// src/store/auth.store.ts
'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService, User } from '@/src/service/auth.service';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: 'super_admin' | 'admin' | 'staff' | null;
  isHydrated: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: { name: string; email: string; phone?: string; password: string; role?: 'super_admin' | 'admin' | 'staff' }) => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isAdmin: false,
      isSuperAdmin: false,
      role: null,
      isHydrated: false,

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

      getCurrentUser: async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          set({ isAuthenticated: false, user: null, isLoading: false });
          return;
        }

        // ✅ Prevent multiple calls
        if (get().isLoading) return;

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

      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ isLoading: loading }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
      reset: () => {
        localStorage.removeItem('accessToken');
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          isAdmin: false,
          isSuperAdmin: false,
          role: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        isAdmin: state.isAdmin,
        isSuperAdmin: state.isSuperAdmin,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);