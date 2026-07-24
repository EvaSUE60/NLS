// src/hooks/useSession.ts
'use client';

import { useEffect } from 'react';
import { useSessionStore } from '@/src/store/session.store';
import { SessionFilters, CreateSessionData, UpdateSessionData, GenerateSessionsData } from '@/src/types/session.types';

export const useSession = (autoFetch: boolean = true) => {
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
    clearError,
    resetFilters,
  } = useSessionStore();

  useEffect(() => {
    if (autoFetch) {
      fetchSessions();
    }
  }, [autoFetch]);

  const filterByDay = (day: number) => {
    return fetchSessions({ day });
  };

  const filterByType = (type: 'morning' | 'afternoon') => {
    return fetchSessions({ type });
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
    fetchSession,
    create: createSession,
    update: updateSession,
    delete: deleteSession,
    generate: generateSessions,
    checkIn: checkInAttendance,

    // Utilities & Filters
    filterByDay,
    filterByType,
    setSelectedSession,
    clearError,
    resetFilters,
  };
};
