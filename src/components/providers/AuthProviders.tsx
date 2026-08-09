// src/components/providers/AuthProvider.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/src/store/auth.store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { getCurrentUser, isAuthenticated, isHydrated } = useAuthStore();
  const isMounted = useRef(false);

  // ✅ Use ref to track mounted state without causing re-renders
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ✅ Handle auth check after hydration
  useEffect(() => {
    // Only run when hydrated and mounted
    if (!isHydrated || !isMounted.current) return;

    const token = localStorage.getItem('accessToken');
    
    // If we have a token but not authenticated, fetch user
    if (token && !isAuthenticated) {
      getCurrentUser();
    }
  }, [isHydrated, isAuthenticated, getCurrentUser]);

  // ✅ No need to check isMounted for rendering since we don't use it for rendering

  return <>{children}</>;
}