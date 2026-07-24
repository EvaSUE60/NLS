// src/store/seminar.store.ts
'use client';

import { create } from 'zustand';
import {
  Seminar,
  CreateSeminarData,
  UpdateSeminarData,
  GenerateSeminarsData,
  SeminarFilters,
  SeminarStats,
  Participant,
} from '@/src/types/seminar.types';
import { seminarService } from '@/src/service/seminar.service';

interface SeminarState {
  // ==================== STATE ====================
  seminars: Seminar[];
  selectedSeminar: Seminar | null;
  participants: Participant[];
  participantsStats: {
    total_registered: number;
    attended: number;
    not_attended: number;
    capacity: number;
    remaining_slots: number;
  } | null;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  filters: SeminarFilters;
  stats: SeminarStats | null;

  // ==================== ACTIONS ====================
  fetchSeminars: (filters?: SeminarFilters) => Promise<void>;
  fetchSeminar: (id: string) => Promise<void>;
  createSeminar: (data: CreateSeminarData) => Promise<Seminar>;
  updateSeminar: (id: string, data: UpdateSeminarData) => Promise<Seminar>;
  deleteSeminar: (id: string) => Promise<void>;
  generateSeminars: (data: GenerateSeminarsData) => Promise<void>;
  fetchStats: (day?: number) => Promise<void>;
  fetchParticipants: (id: string, attended?: boolean) => Promise<void>;
  registerAttendee: (id: string, nls_id: string) => Promise<void>;
  checkInAttendance: (id: string, nls_id: string, method?: 'manual' | 'qr_code') => Promise<void>;
  
  clearSelected: () => void;
  clearError: () => void;
  resetFilters: () => void;
}

const initialFilters: SeminarFilters = {
  day: undefined,
  seminar_key: undefined,
  isActive: true,
  date: undefined,
};

export const useSeminarStore = create<SeminarState>((set, get) => ({
  // ==================== INITIAL STATE ====================
  seminars: [],
  selectedSeminar: null,
  participants: [],
  participantsStats: null,
  isLoading: false,
  isProcessing: false,
  error: null,
  filters: initialFilters,
  stats: null,

  // ==================== FETCH SEMINARS ====================
  fetchSeminars: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const newFilters = { ...get().filters, ...filters };
      set({ filters: newFilters });

      const response = await seminarService.getSeminars(newFilters);
      set({
        seminars: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch seminars',
        isLoading: false,
      });
    }
  },

  // ==================== FETCH SINGLE SEMINAR ====================
  fetchSeminar: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await seminarService.getSeminar(id);
      set({
        selectedSeminar: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch seminar',
        isLoading: false,
      });
    }
  },

  // ==================== CREATE SEMINAR ====================
  createSeminar: async (data) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await seminarService.createSeminar(data);
      const newSeminar = response.data.data;
      set((state) => ({
        seminars: [...state.seminars, newSeminar],
        isProcessing: false,
      }));
      return newSeminar;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create seminar',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== UPDATE SEMINAR ====================
  updateSeminar: async (id, data) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await seminarService.updateSeminar(id, data);
      const updatedSeminar = response.data.data;
      set((state) => ({
        seminars: state.seminars.map((s) => (s._id === id ? updatedSeminar : s)),
        selectedSeminar: state.selectedSeminar?._id === id ? updatedSeminar : state.selectedSeminar,
        isProcessing: false,
      }));
      return updatedSeminar;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update seminar',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== DELETE SEMINAR ====================
  deleteSeminar: async (id) => {
    set({ isProcessing: true, error: null });
    try {
      await seminarService.deleteSeminar(id);
      set((state) => ({
        seminars: state.seminars.filter((s) => s._id !== id),
        selectedSeminar: state.selectedSeminar?._id === id ? null : state.selectedSeminar,
        isProcessing: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete seminar',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== GENERATE SEMINARS ====================
  generateSeminars: async (data) => {
    set({ isProcessing: true, error: null });
    try {
      await seminarService.generateSeminars(data);
      await get().fetchSeminars();
      set({ isProcessing: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to generate seminars',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== FETCH STATS ====================
  fetchStats: async (day) => {
    set({ isLoading: true, error: null });
    try {
      const response = await seminarService.getSeminarStats(day);
      set({
        stats: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch seminar stats',
        isLoading: false,
      });
    }
  },

  // ==================== FETCH PARTICIPANTS ====================
  fetchParticipants: async (id, attended) => {
    set({ isLoading: true, error: null });
    try {
      const response = await seminarService.getParticipants(id, attended);
      set({
        participants: response.data.data.participants,
        participantsStats: response.data.data.stats,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch participants',
        isLoading: false,
      });
    }
  },

  // ==================== REGISTER ATTENDEE ====================
  registerAttendee: async (id, nls_id) => {
    set({ isProcessing: true, error: null });
    try {
      await seminarService.registerAttendee(id, nls_id);
      await get().fetchSeminar(id);
      await get().fetchParticipants(id);
      set({ isProcessing: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to register attendee',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== CHECK-IN ATTENDANCE ====================
  checkInAttendance: async (id, nls_id, method = 'manual') => {
    set({ isProcessing: true, error: null });
    try {
      await seminarService.checkInAttendance(id, nls_id, method);
      await get().fetchSeminar(id);
      await get().fetchParticipants(id);
      set({ isProcessing: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to check in attendee',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== UTILITIES ====================
  clearSelected: () => set({ selectedSeminar: null, participants: [], participantsStats: null }),
  clearError: () => set({ error: null }),
  resetFilters: () => {
    set({ filters: initialFilters });
    get().fetchSeminars(initialFilters);
  },
}));
