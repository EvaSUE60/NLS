// src/hooks/useSeminar.ts
'use client';

import { useEffect, useCallback } from 'react';
import { useSeminarStore } from '@/src/store/seminar.store';
import { SeminarFilters } from '@/src/types/seminar.types';

export const useSeminar = (autoFetch: boolean = true) => {
  const {
    seminars,
    selectedSeminar,
    participants,
    participantsStats,
    isLoading,
    isProcessing,
    isGenerating,
    error,
    filters,
    stats,

    fetchSeminars,
    fetchSeminar,
    createSeminar,
    updateSeminar,
    deleteSeminar,
    generateSeminars,
    fetchStats,
    fetchParticipants,
    registerAttendee,
    checkInAttendance,
    clearSelected,
    clearError,
    resetFilters,
  } = useSeminarStore();

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchSeminars();
      fetchStats();
    }
  }, [autoFetch, fetchSeminars, fetchStats]);

  // Filter helpers
  const filterByDay = useCallback((day: number) => {
    return fetchSeminars({ day });
  }, [fetchSeminars]);

  const filterByTopic = useCallback((seminarKey: string) => {
    return fetchSeminars({ seminar_key: seminarKey });
  }, [fetchSeminars]);

  const refetch = useCallback((filters?: SeminarFilters) => {
    return fetchSeminars(filters);
  }, [fetchSeminars]);

  return {
    // State
    seminars,
    selectedSeminar,
    participants,
    participantsStats,
    isLoading,
    isProcessing,
    isGenerating,
    error,
    filters,
    stats,

    // Methods
    fetchSeminars,
    fetchSeminar,
    create: createSeminar,
    update: updateSeminar,
    delete: deleteSeminar,
    generate: generateSeminars,
    fetchStats,
    fetchParticipants,
    register: registerAttendee,
    checkIn: checkInAttendance,
    
    // Filters & Utilities
    filterByDay,
    filterByTopic,
    refetch,
    clearSelected,
    clearError,
    resetFilters,
  };
};