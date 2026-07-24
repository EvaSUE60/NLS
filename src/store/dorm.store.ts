// src/lib/stores/dorm.store.ts
'use client';

import { create } from 'zustand';
import {
  DormStats,
  DormAssignment,
  AutoAssignResponse,
  AssignmentFilters,
} from '@/src/types/dorm.types';
import { ResetDormResponse } from '@/src/types/dorm.types';
import { dormService } from '@/src/service/dorm.service';

interface DormState {
  // ==================== STATE ====================
  stats: DormStats | null;
  assignments: DormAssignment[];
  selectedAssignment: DormAssignment | null;
  isLoading: boolean;
  error: string | null;
  isProcessing: boolean;
  lastAutoAssignResult: AutoAssignResponse | null;
  filters: AssignmentFilters;

  // ==================== ACTIONS ====================
  fetchStats: () => Promise<void>;
  fetchAssignments: (filters?: AssignmentFilters) => Promise<void>;
  fetchAssignment: (id: string) => Promise<void>;
  autoAssign: () => Promise<AutoAssignResponse>;
  resetDorm: () => Promise<ResetDormResponse>;
  removeAssignment: (id: string) => Promise<void>;
  clearSelected: () => void;
  clearError: () => void;
  setFilters: (filters: AssignmentFilters) => void;
  resetFilters: () => void;
}

const initialFilters: AssignmentFilters = {
  status: 'active',
  building_id: undefined,
  room_id: undefined,
};

export const useDormStore = create<DormState>((set, get) => ({
  // ==================== INITIAL STATE ====================
  stats: null,
  assignments: [],
  selectedAssignment: null,
  isLoading: false,
  error: null,
  isProcessing: false,
  lastAutoAssignResult: null,
  filters: initialFilters,

  // ==================== FETCH STATS ====================
  // GET /api/dorm/stats
  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await dormService.getDormStats();
      set({
        stats: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch dorm statistics',
        isLoading: false,
      });
    }
  },

  // ==================== FETCH ASSIGNMENTS ====================
  // GET /api/dorm/assignments
  fetchAssignments: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const newFilters = { ...get().filters, ...filters };
      set({ filters: newFilters });

      const response = await dormService.getAssignments(newFilters);
      set({
        assignments: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch assignments',
        isLoading: false,
      });
    }
  },

  // ==================== FETCH SINGLE ASSIGNMENT ====================
  // GET /api/dorm/assignments/[id]
  fetchAssignment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await dormService.getAssignment(id);
      set({
        selectedAssignment: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch assignment',
        isLoading: false,
      });
    }
  },

  // ==================== AUTO-ASSIGN ====================
  // POST /api/dorm/assign
  autoAssign: async () => {
    set({ isProcessing: true, error: null });
    try {
      const response = await dormService.autoAssign();
      set({
        lastAutoAssignResult: response.data,
        isProcessing: false,
      });
      
      // Refresh stats and assignments
      await get().fetchStats();
      await get().fetchAssignments();
      
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to auto-assign attendees',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== RESET DORM ====================
  // POST /api/dorm/reset
  resetDorm: async () => {
    set({ isProcessing: true, error: null });
    try {
      const response = await dormService.resetDorm(true);
      set({
        isProcessing: false,
      });
      
      // Refresh stats and assignments
      await get().fetchStats();
      await get().fetchAssignments();
      
      return response.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to reset dorm assignments',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== REMOVE ASSIGNMENT ====================
  // DELETE /api/dorm/assignments/[id]
  removeAssignment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await dormService.removeAssignment(id);
      
      set((state) => ({
        assignments: state.assignments.filter((a) => a._id !== id),
        selectedAssignment: state.selectedAssignment?._id === id ? null : state.selectedAssignment,
        isLoading: false,
      }));
      
      // Refresh stats
      await get().fetchStats();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to remove assignment',
        isLoading: false,
      });
      throw error;
    }
  },

  // ==================== SET FILTERS ====================
  setFilters: (filters) => {
    set({ filters: { ...get().filters, ...filters } });
    get().fetchAssignments(get().filters);
  },

  // ==================== RESET FILTERS ====================
  resetFilters: () => {
    set({ filters: initialFilters });
    get().fetchAssignments(initialFilters);
  },

  // ==================== CLEAR SELECTED ====================
  clearSelected: () => {
    set({ selectedAssignment: null });
  },

  // ==================== CLEAR ERROR ====================
  clearError: () => {
    set({ error: null });
  },
}));