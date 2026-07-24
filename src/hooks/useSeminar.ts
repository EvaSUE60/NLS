// src/hooks/useSeminar.ts
'use client';

import { useEffect } from 'react';
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

  useEffect(() => {
    if (autoFetch) {
      fetchSeminars();
      fetchStats();
    }
  }, [autoFetch]);

  const filterByDay = (day: number) => {
    return fetchSeminars({ day });
  };

  const filterByTopic = (seminarKey: string) => {
    return fetchSeminars({ seminar_key: seminarKey });
  };

  const refetch = (filters?: SeminarFilters) => {
    return fetchSeminars(filters);
  };

  return {
    // State
    seminars,
    selectedSeminar,
    participants,
    participantsStats,
    isLoading,
    isProcessing,
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
