// src/hooks/useSession.ts
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSessionStore } from '@/src/store/session.store';
import { SessionFilters, CreateSessionData, UpdateSessionData, GenerateSessionsData } from '@/src/types/session.types';

export const useSession = (autoFetch: boolean = true) => {
  const pathname = usePathname();
  const {
    sessions,
    selectedSession,
    filters,
    isLoading,
    isProcessing,
    error,
    lastCheckInResult,

    fetchSessions,
    fetchSession,
    createSession,
    updateSession,
    deleteSession,
    generateSessions,
    checkInAttendance,
    setSelectedSession,
    clearSelected,
    clearError,
    resetFilters,
  } = useSessionStore();

  // ✅ Only auto-fetch if not on create page and autoFetch is true
  useEffect(() => {
    if (autoFetch && !pathname?.includes('/sessions/create') && !pathname?.includes('/sessions/generate')) {
      fetchSessions();
    }
  }, [autoFetch, pathname]);

  const filterByDay = (day: number) => {
    return fetchSessions({ day });
  };

  const filterByType = (type: 'morning' | 'afternoon') => {
    return fetchSessions({ type });
  };

  // ✅ Safe fetch with guards
  const safeFetchSession = (id: string) => {
    if (!id || id === 'create' || id === 'undefined' || id === 'null') {
      console.warn('Invalid session ID provided:', id);
      return;
    }
    return fetchSession(id);
  };

  return {
    // State
    sessions,
    selectedSession,
    filters,
    isLoading,
    isProcessing,
    error,
    lastCheckInResult,

    // Methods
    fetchSessions,
    fetchSession: safeFetchSession,
    create: createSession,
    update: updateSession,
    delete: deleteSession,
    generate: generateSessions,
    checkIn: checkInAttendance,

    // Utilities & Filters
    filterByDay,
    filterByType,
    setSelectedSession,
    clearSelected,
    clearError,
    resetFilters,
  };
};