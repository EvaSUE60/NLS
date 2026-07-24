// src/lib/hooks/useAttendee.ts
'use client';

import { useEffect } from 'react';
import { useAttendeeStore } from '@/src/store/attendee.store';
import { AttendeeFilters } from '@/src/types/attendee.types';

export const useAttendee = () => {
  const {
    attendees,
    selectedAttendee,
    isLoading,
    error,
    pagination,
    filters,
    stats,
    regions,
    fetchAttendees,
    fetchAttendee,
    fetchAttendeeByNLS,
    createAttendee,
    updateAttendee,
    deleteAttendee,
    checkInArrival,
    bulkCheckIn,
    fetchArrivalStats,
    searchAttendees,
    importAttendees,
    clearSelected,
    clearError,
    resetFilters,
  } = useAttendeeStore();

  // ==================== AUTO-FETCH ON MOUNT ====================
  useEffect(() => {
    fetchAttendees();
  }, []);

  // ==================== REFETCH WITH NEW FILTERS ====================
  const refetch = (filters?: AttendeeFilters) => {
    return fetchAttendees(filters);
  };

  // ==================== GO TO PAGE ====================
  const goToPage = (page: number) => {
    return fetchAttendees({ ...filters, page });
  };

  // ==================== CHANGE LIMIT ====================
  const setLimit = (limit: number) => {
    return fetchAttendees({ ...filters, limit, page: 1 });
  };

  // ==================== APPLY SEARCH ====================
  const search = (query: string) => {
    return fetchAttendees({ ...filters, search: query, page: 1 });
  };

  // ==================== FILTER BY REGION ====================
  const filterByRegion = (region: string) => {
    return fetchAttendees({ ...filters, region, page: 1 });
  };

  // ==================== FILTER BY GENDER ====================
  const filterByGender = (gender: 'Male' | 'Female' | undefined) => {
    return fetchAttendees({ ...filters, gender, page: 1 });
  };

  // ==================== FILTER BY ARRIVAL STATUS ====================
  const filterByArrival = (arrived: boolean | undefined) => {
    return fetchAttendees({ ...filters, arrived, page: 1 });
  };

  // ==================== FIND ATTENDEE ====================
  const findAttendee = (uniqueId: string) => {
    return fetchAttendeeByNLS(uniqueId);
  };

  return {
    // ==================== STATE ====================
    attendees,
    selectedAttendee,
    isLoading,
    error,
    pagination,
    filters,
    stats,
    regions,

    // ==================== CRUD ACTIONS ====================
    create: createAttendee,
    update: updateAttendee,
    delete: deleteAttendee,
    getById: fetchAttendee,
    getByNLS: fetchAttendeeByNLS,
    find: findAttendee,

    // ==================== CHECK-IN ACTIONS ====================
    checkIn: checkInArrival,
    bulkCheckIn: bulkCheckIn,

    // ==================== FETCH ACTIONS ====================
    fetch: fetchAttendees,
    refetch,
    fetchStats: fetchArrivalStats,

    // ==================== SEARCH & FILTER ====================
    search,
    searchAttendees,
    filterByRegion,
    filterByGender,
    filterByArrival,

    // ==================== PAGINATION ====================
    goToPage,
    setLimit,

    // ==================== IMPORT ====================
    import: importAttendees,

    // ==================== UTILITY ====================
    clearSelected,
    clearError,
    resetFilters,
  };
};