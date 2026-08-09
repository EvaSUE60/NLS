// src/lib/stores/attendee.store.ts
'use client';

import { create } from 'zustand';
import { Attendee, AttendeeFilters, AttendeeStats } from '@/src/types/attendee.types';
import { attendeeService } from '@/src/service/attendee.service';

interface AttendeeState {
  // ==================== STATE ====================
  attendees: Attendee[];
  selectedAttendee: Attendee | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  filters: AttendeeFilters;
  stats: AttendeeStats | null;
  regions: string[];
  isInitialized: boolean;
  isFetching: boolean;

  // ==================== ACTIONS ====================
  fetchAttendees: (filters?: AttendeeFilters) => Promise<void>;
  fetchAttendee: (id: string) => Promise<void>;
  fetchAttendeeByNLS: (nlsId: string) => Promise<Attendee | null>;
  createAttendee: (data: any) => Promise<Attendee>;
  updateAttendee: (id: string, data: any) => Promise<Attendee>;
  deleteAttendee: (id: string) => Promise<void>;
  checkInArrival: (id: string, method?: 'manual' | 'bulk' | 'qr_code') => Promise<void>;
  bulkCheckIn: (attendeeIds: string[]) => Promise<void>;
  fetchArrivalStats: () => Promise<void>;
  searchAttendees: (query: string, by?: 'unique_id' | 'name' | 'email' | 'phone') => Promise<Attendee[]>;
  importAttendees: () => Promise<void>;
  exportAttendees: (filters?: any) => Promise<void>; // ✅ Add this
  clearSelected: () => void;
  clearError: () => void;
  resetFilters: () => void;
  initialize: () => Promise<void>;
}

const initialFilters: AttendeeFilters = {
  page: 1,
  limit: 20,
  search: '',
  region: '',
  gender: undefined,
  paymentStatus: undefined,
  arrived: undefined,
};

export const useAttendeeStore = create<AttendeeState>((set, get) => ({
  // ==================== INITIAL STATE ====================
  attendees: [],
  selectedAttendee: null,
  isLoading: false,
  error: null,
  pagination: null,
  filters: initialFilters,
  stats: null,
  regions: [],
  isInitialized: false,
  isFetching: false,

  // ==================== INITIALIZE ====================
  initialize: async () => {
    if (get().isInitialized || get().isFetching) {
      return;
    }

    set({ isLoading: true, isFetching: true, error: null });
    try {
      const response = await attendeeService.getAttendees({ page: 1, limit: 20 });
      const { attendees, pagination, filters: responseFilters, stats } = response.data.data;

      set((state) => ({
        attendees,
        pagination,
        regions: responseFilters?.regions || [],
        stats: stats !== undefined ? { ...(state.stats || {}), ...stats } : state.stats,
        isInitialized: true,
        isLoading: false,
        isFetching: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to initialize attendees',
        isLoading: false,
        isFetching: false,
        isInitialized: true,
      });
    }
  },

  // ==================== FETCH ATTENDEES ====================
  fetchAttendees: async (filters) => {
    if (get().isFetching) {
      return;
    }

    set({ isLoading: true, isFetching: true, error: null });
    try {
      const newFilters = { ...get().filters, ...filters };
      set({ filters: newFilters });

      const response = await attendeeService.getAttendees(newFilters);
      const { attendees, pagination, filters: responseFilters, stats } = response.data.data;

      set((state) => ({
        attendees,
        pagination,
        regions: responseFilters?.regions || [],
        stats: stats !== undefined ? { ...(state.stats || {}), ...stats } : state.stats,
        isInitialized: true,
        isLoading: false,
        isFetching: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch attendees',
        isLoading: false,
        isFetching: false,
      });
    }
  },

  // ==================== FETCH SINGLE ATTENDEE ====================
  fetchAttendee: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendeeService.getAttendee(id);
      set({
        selectedAttendee: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch attendee',
        isLoading: false,
      });
    }
  },

  // ==================== FETCH ATTENDEE BY NLS ID ====================
  fetchAttendeeByNLS: async (nlsId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendeeService.getAttendeeByNLS(nlsId);
      const attendees = response.data.data.attendees;
      const attendee = attendees?.[0] || null;
      set({
        selectedAttendee: attendee,
        isLoading: false,
      });
      return attendee;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to find attendee',
        isLoading: false,
      });
      return null;
    }
  },

  // ==================== CREATE ATTENDEE ====================
  createAttendee: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendeeService.createAttendee(data);
      const newAttendee = response.data.data;
      set((state) => ({
        attendees: [newAttendee, ...state.attendees],
        isLoading: false,
      }));
      return newAttendee;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create attendee',
        isLoading: false,
      });
      throw error;
    }
  },

  // ==================== UPDATE ATTENDEE ====================
  updateAttendee: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendeeService.updateAttendee(id, data);
      const updatedAttendee = response.data.data;
      set((state) => ({
        attendees: state.attendees.map((a) => (a._id === id ? updatedAttendee : a)),
        selectedAttendee: updatedAttendee,
        isLoading: false,
      }));
      return updatedAttendee;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update attendee',
        isLoading: false,
      });
      throw error;
    }
  },

  // ==================== DELETE ATTENDEE ====================
  deleteAttendee: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await attendeeService.deleteAttendee(id);
      set((state) => ({
        attendees: state.attendees.filter((a) => a._id !== id),
        selectedAttendee: null,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete attendee',
        isLoading: false,
      });
      throw error;
    }
  },

  // ==================== ARRIVAL CHECK-IN ====================
  checkInArrival: async (id, method = 'manual') => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendeeService.checkInArrival(id, method);
      const updatedAttendee = response.data.data;
      set((state) => ({
        attendees: state.attendees.map((a) => (a._id === id ? updatedAttendee : a)),
        selectedAttendee: updatedAttendee,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to check in attendee',
        isLoading: false,
      });
      throw error;
    }
  },

  // ==================== BULK ARRIVAL CHECK-IN ====================
  bulkCheckIn: async (attendeeIds) => {
    set({ isLoading: true, error: null });
    try {
      await attendeeService.bulkCheckIn(attendeeIds);
      await get().fetchAttendees();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to check in attendees',
        isLoading: false,
      });
      throw error;
    }
  },

  // ==================== FETCH ARRIVAL STATISTICS ====================
  fetchArrivalStats: async () => {
    if (get().isFetching) {
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await attendeeService.getArrivalStats();
      const statsData = response.data.data;

      if (statsData) {
        set({
          stats: statsData,
          isLoading: false,
        });
      } else {
        set({
          stats: null,
          isLoading: false,
        });
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      set({
        error: error.response?.data?.message || 'Failed to fetch statistics',
        isLoading: false,
      });
    }
  },

  // ==================== SEARCH ATTENDEES ====================
  searchAttendees: async (query, by) => {
    if (get().isFetching) {
      return [];
    }

    set({ isLoading: true, isFetching: true, error: null });
    try {
      const response = await attendeeService.searchAttendees(query, by);
      const attendees = response.data.data.attendees;
      set({
        attendees,
        isLoading: false,
        isFetching: false,
      });
      return attendees;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to search attendees',
        isLoading: false,
        isFetching: false,
      });
      return [];
    }
  },

  // ==================== IMPORT ATTENDEES ====================
  importAttendees: async () => {
    set({ isLoading: true, error: null });
    try {
      await attendeeService.importAttendees();
      await get().fetchAttendees();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to import attendees',
        isLoading: false,
      });
      throw error;
    }
  },

  // ==================== ✅ EXPORT ATTENDEES ====================
  exportAttendees: async (filters?: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await attendeeService.exportAttendees(filters);
      
      // Get filename from Content-Disposition header or generate one
      let filename = `attendees_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create download link and trigger download
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = window.URL.createObjectURL(blob);
      
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      set({ isLoading: false });
    } catch (error: any) {
      console.error('Export attendees error:', error);
      set({
        error: error.response?.data?.message || 'Failed to export attendees',
        isLoading: false,
      });
      throw error;
    }
  },

  // ==================== CLEAR SELECTED ====================
  clearSelected: () => {
    set({ selectedAttendee: null });
  },

  // ==================== CLEAR ERROR ====================
  clearError: () => {
    set({ error: null });
  },

  // ==================== RESET FILTERS ====================
  resetFilters: () => {
    set({ filters: initialFilters });
    get().fetchAttendees(initialFilters);
  },
}));