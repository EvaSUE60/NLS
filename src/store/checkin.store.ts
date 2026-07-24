// src/lib/stores/checkin.store.ts
'use client';

import { create } from 'zustand';
import {
  AttendeeSearchResult,
  CheckInStats,
  SessionAttendance,
  SeminarAttendance,
} from '@/src/types/checkin.types';
import { checkinService } from '@/src/service/checkin.service';

interface CheckInState {
  // ==================== STATE ====================
  searchResults: AttendeeSearchResult[];
  selectedAttendee: AttendeeSearchResult | null;
  isLoading: boolean;
  error: string | null;
  stats: CheckInStats | null;
  sessionAttendance: SessionAttendance[];
  seminarAttendance: SeminarAttendance[];
  isCheckingIn: boolean;
  lastCheckInResult: any | null;

  // ==================== ARRIVAL CHECK-IN ACTIONS ====================
  searchAttendee: (query: string, by?: 'unique_id' | 'name' | 'email' | 'phone') => Promise<AttendeeSearchResult[]>;
  selectAttendee: (attendee: AttendeeSearchResult | null) => void;
  checkInArrival: (attendeeId: string, method?: 'manual' | 'bulk' | 'qr_code') => Promise<void>;
  bulkCheckIn: (attendeeIds: string[], method?: 'manual' | 'bulk') => Promise<void>;

  // ==================== SESSION CHECK-IN ACTIONS ====================
  checkInSession: (sessionId: string, nlsId: string, method?: 'manual' | 'qr_code') => Promise<void>;
  fetchSessionAttendance: (attendeeId: string) => Promise<void>;

  // ==================== SEMINAR CHECK-IN ACTIONS ====================
  checkInSeminar: (seminarId: string, nlsId: string, method?: 'manual' | 'qr_code') => Promise<void>;
  fetchSeminarAttendance: (attendeeId: string) => Promise<void>;

  // ==================== STATS ACTIONS ====================
  fetchStats: () => Promise<void>;

  // ==================== UTILITY ACTIONS ====================
  clearError: () => void;
  clearSelected: () => void;
  reset: () => void;
}

const initialState = {
  searchResults: [],
  selectedAttendee: null,
  isLoading: false,
  error: null,
  stats: null,
  sessionAttendance: [],
  seminarAttendance: [],
  isCheckingIn: false,
  lastCheckInResult: null,
};

export const useCheckInStore = create<CheckInState>((set, get) => ({
  ...initialState,

  // ==================== SEARCH ATTENDEE ====================
  searchAttendee: async (query, by) => {
    set({ isLoading: true, error: null });
    try {
      const response = await checkinService.searchAttendee(query, by);
      const results = response.data.data.attendees;
      set({
        searchResults: results,
        selectedAttendee: results.length === 1 ? results[0] : null,
        isLoading: false,
      });
      return results;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to search attendees',
        isLoading: false,
      });
      return [];
    }
  },

  // ==================== SELECT ATTENDEE ====================
  selectAttendee: (attendee) => {
    set({ selectedAttendee: attendee });
  },

  // ==================== ARRIVAL CHECK-IN ====================
  checkInArrival: async (attendeeId, method = 'manual') => {
    set({ isCheckingIn: true, error: null });
    try {
      const response = await checkinService.checkInArrival({ attendeeId, method });
      set({
        lastCheckInResult: response.data,
        isCheckingIn: false,
      });
      
      // Refresh selected attendee
      const { selectedAttendee } = get();
      if (selectedAttendee) {
        await get().searchAttendee(selectedAttendee.unique_id, 'unique_id');
      }
      
      // Refresh stats
      await get().fetchStats();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to check in attendee',
        isCheckingIn: false,
      });
      throw error;
    }
  },

  // ==================== BULK CHECK-IN ====================
  bulkCheckIn: async (attendeeIds, method = 'bulk') => {
    set({ isCheckingIn: true, error: null });
    try {
      const response = await checkinService.bulkCheckIn({ attendeeIds, method });
      set({
        lastCheckInResult: response.data,
        isCheckingIn: false,
      });
      
      // Refresh stats
      await get().fetchStats();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to bulk check in',
        isCheckingIn: false,
      });
      throw error;
    }
  },

  // ==================== SESSION CHECK-IN ====================
  checkInSession: async (sessionId, nlsId, method = 'manual') => {
    set({ isCheckingIn: true, error: null });
    try {
      const response = await checkinService.checkInSession({ sessionId, nls_id: nlsId, method });
      set({
        lastCheckInResult: response.data,
        isCheckingIn: false,
      });
      
      // Refresh session attendance
      const { selectedAttendee } = get();
      if (selectedAttendee) {
        await get().fetchSessionAttendance(selectedAttendee._id);
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to check in to session',
        isCheckingIn: false,
      });
      throw error;
    }
  },

  // ==================== SEMINAR CHECK-IN ====================
  checkInSeminar: async (seminarId, nlsId, method = 'manual') => {
    set({ isCheckingIn: true, error: null });
    try {
      const response = await checkinService.checkInSeminar({ seminarId, nls_id: nlsId, method });
      set({
        lastCheckInResult: response.data,
        isCheckingIn: false,
      });
      
      // Refresh seminar attendance
      const { selectedAttendee } = get();
      if (selectedAttendee) {
        await get().fetchSeminarAttendance(selectedAttendee._id);
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to check in to seminar',
        isCheckingIn: false,
      });
      throw error;
    }
  },

  // ==================== FETCH STATS ====================
  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await checkinService.getArrivalStats();
      set({
        stats: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch stats',
        isLoading: false,
      });
    }
  },

  // ==================== FETCH SESSION ATTENDANCE ====================
  fetchSessionAttendance: async (attendeeId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await checkinService.getSessionAttendance(attendeeId);
      set({
        sessionAttendance: response.data.data.sessions,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch session attendance',
        isLoading: false,
      });
    }
  },

  // ==================== FETCH SEMINAR ATTENDANCE ====================
  fetchSeminarAttendance: async (attendeeId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await checkinService.getSeminarAttendance(attendeeId);
      set({
        seminarAttendance: response.data.data.seminars,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch seminar attendance',
        isLoading: false,
      });
    }
  },

  // ==================== UTILITY ACTIONS ====================
  clearError: () => set({ error: null }),
  
  clearSelected: () => set({ selectedAttendee: null }),
  
  reset: () => {
    set({
      ...initialState,
      stats: get().stats, // Keep stats
    });
  },
}));