// src/hooks/useAuth.ts
'use client';

import { useEffect, useRef } from 'react';
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
    isHydrated,
    login,
    logout,
    register,
    getCurrentUser,
    clearError,
  } = useAuthStore();

  const router = useRouter();
  const initialized = useRef(false);

  // ✅ Check auth status on mount and when hydrated
  useEffect(() => {
    if (!isHydrated) return;

    const token = localStorage.getItem('accessToken');
    
    if (token && !isAuthenticated && !isLoading && !initialized.current) {
      initialized.current = true;
      getCurrentUser();
    }
  }, [isHydrated, isAuthenticated, isLoading, getCurrentUser]);

  // ✅ Reset initialized flag when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      initialized.current = false;
    }
  }, [isAuthenticated]);

  const loginWithRedirect = async (email: string, password: string, redirectTo?: string) => {
    try {
      await login(email, password);
      router.push(redirectTo || '/dashboard');
    } catch (error) {
      throw error;
    }
  };

  const logoutWithRedirect = async (redirectTo?: string) => {
    await logout();
    initialized.current = false;
    router.push(redirectTo || '/login');
  };

  const hasRole = (roles: string[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdminUser = isAdmin || isSuperAdmin;

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    role,
    isAdmin: isAdminUser,
    isSuperAdmin,
    isHydrated,

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