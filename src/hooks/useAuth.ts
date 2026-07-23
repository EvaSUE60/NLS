// src/hooks/useAuth.ts
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/src/store/auth.store';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    isAdmin,
    isSuperAdmin,
    role,
    login,
    logout,
    register,
    getCurrentUser,
    clearError,
  } = useAuthStore();

  const router = useRouter();

  // Check auth status on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token && !isAuthenticated) {
      getCurrentUser();
    }
  }, [isAuthenticated, getCurrentUser]);

  // Login with redirect
  const loginWithRedirect = async (email: string, password: string, redirectTo?: string) => {
    try {
      await login(email, password);
      router.push(redirectTo || '/dashboard');
    } catch (error) {
      throw error;
    }
  };

  // Logout with redirect
  const logoutWithRedirect = async (redirectTo?: string) => {
    await logout();
    router.push(redirectTo || '/login');
  };

  // Check if user has required role
  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // Check if user is admin (admin or super_admin)
  const isAdminUser = isAdmin || isSuperAdmin;

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    role,
    isAdmin: isAdminUser,
    isSuperAdmin,

    // Actions
    login,
    loginWithRedirect,
    logout,
    logoutWithRedirect,
    register,
    getCurrentUser,
    clearError,
    hasRole,
  };
};