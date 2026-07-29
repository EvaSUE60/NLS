// src/lib/hooks/useCheckin.ts
'use client';

import { useEffect } from 'react';
import { useCheckInStore } from '@/src/store/checkin.store';
import { 
  AttendeeSearchResult,
  ArrivalCheckInResponse,
  SessionCheckInResponse,
  SeminarCheckInResponse,
} from '@/src/types/checkin.types';

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
  }, [fetchStats]);

  // ==================== SEARCH BY NLS ID ====================
  const searchByNLS = (nlsId: string): Promise<AttendeeSearchResult[]> => {
    return searchAttendee(nlsId, 'unique_id');
  };

  // ==================== SEARCH BY NAME ====================
  const searchByName = (name: string): Promise<AttendeeSearchResult[]> => {
    return searchAttendee(name, 'name');
  };

  // ==================== SEARCH BY EMAIL ====================
  const searchByEmail = (email: string): Promise<AttendeeSearchResult[]> => {
    return searchAttendee(email, 'email');
  };

  // ==================== SEARCH BY PHONE ====================
  const searchByPhone = (phone: string): Promise<AttendeeSearchResult[]> => {
    return searchAttendee(phone, 'phone');
  };

  // ==================== CHECK-IN SELECTED ATTENDEE ====================
  const checkInSelected = (method: 'manual' | 'qr_code' = 'manual'): Promise<ArrivalCheckInResponse> => {
    if (!selectedAttendee) {
      throw new Error('No attendee selected');
    }
    return checkInArrival(selectedAttendee._id, method);
  };

  // ==================== SESSION CHECK-IN ====================
  const checkInToSession = (sessionId: string, nlsId: string, method: 'manual' | 'qr_code' = 'manual'): Promise<SessionCheckInResponse> => {
    return checkInSession(sessionId, nlsId, method);
  };

  // ==================== SEMINAR CHECK-IN ====================
  const checkInToSeminar = (seminarId: string, nlsId: string, method: 'manual' | 'qr_code' = 'manual'): Promise<SeminarCheckInResponse> => {
    return checkInSeminar(seminarId, nlsId, method);
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
    checkInToSession,
    fetchSessionAttendance,

    // ==================== SEMINAR CHECK-IN ====================
    checkInSeminar,
    checkInToSeminar,
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