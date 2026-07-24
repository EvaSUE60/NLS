// src/lib/hooks/useCheckin.ts
'use client';

import { useEffect } from 'react';
import { useCheckInStore } from '@/src/store/checkin.store';

export const useCheckin = () => {
  const {
    // State
    searchResults,
    selectedAttendee,
    isLoading,
    error,
    stats,
    sessionAttendance,
    seminarAttendance,
    isCheckingIn,
    lastCheckInResult,

    // Actions
    searchAttendee,
    selectAttendee,
    checkInArrival,
    bulkCheckIn,
    checkInSession,
    checkInSeminar,
    fetchStats,
    fetchSessionAttendance,
    fetchSeminarAttendance,
    clearError,
    clearSelected,
    reset,
  } = useCheckInStore();

  // ==================== AUTO-FETCH STATS ON MOUNT ====================
  useEffect(() => {
    fetchStats();
  }, []);

  // ==================== SEARCH BY NLS ID ====================
  const searchByNLS = (nlsId: string) => {
    return searchAttendee(nlsId, 'unique_id');
  };

  // ==================== SEARCH BY NAME ====================
  const searchByName = (name: string) => {
    return searchAttendee(name, 'name');
  };

  // ==================== SEARCH BY EMAIL ====================
  const searchByEmail = (email: string) => {
    return searchAttendee(email, 'email');
  };

  // ==================== SEARCH BY PHONE ====================
  const searchByPhone = (phone: string) => {
    return searchAttendee(phone, 'phone');
  };

  // ==================== CHECK-IN SELECTED ATTENDEE ====================
  const checkInSelected = (method: 'manual' | 'qr_code' = 'manual') => {
    if (!selectedAttendee) {
      throw new Error('No attendee selected');
    }
    return checkInArrival(selectedAttendee._id, method);
  };

  return {
    // ==================== STATE ====================
    searchResults,
    selectedAttendee,
    isLoading,
    error,
    stats,
    sessionAttendance,
    seminarAttendance,
    isCheckingIn,
    lastCheckInResult,

    // ==================== SEARCH ====================
    searchByNLS,
    searchByName,
    searchByEmail,
    searchByPhone,
    searchAttendee,

    // ==================== ARRIVAL CHECK-IN ====================
    checkInArrival,
    checkInSelected,
    bulkCheckIn,

    // ==================== SESSION CHECK-IN ====================
    checkInSession,
    fetchSessionAttendance,

    // ==================== SEMINAR CHECK-IN ====================
    checkInSeminar,
    fetchSeminarAttendance,

    // ==================== STATS ====================
    fetchStats,

    // ==================== SELECTION ====================
    selectAttendee,
    clearSelected,

    // ==================== UTILITY ====================
    clearError,
    reset,
  };
};