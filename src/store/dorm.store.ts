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
  isExporting: boolean; // ✅ Add this
  lastAutoAssignResult: AutoAssignResponse | null;
  filters: AssignmentFilters;

  // ==================== ACTIONS ====================
  fetchStats: () => Promise<void>;
  fetchAssignments: (filters?: AssignmentFilters) => Promise<void>;
  fetchAssignment: (id: string) => Promise<void>;
  autoAssign: () => Promise<AutoAssignResponse>;
  resetDorm: () => Promise<ResetDormResponse>;
  removeAssignment: (id: string) => Promise<void>;
  exportDormStats: (filters?: { type?: string; buildingId?: string }) => Promise<void>; // ✅ Add this
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
  isExporting: false, // ✅ Add this
  lastAutoAssignResult: null,
  filters: initialFilters,

  // ==================== FETCH STATS ====================
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
      console.log('Assignments endpoint not available:', error.message);
      set({
        assignments: [],
        isLoading: false,
      });
    }
  },

  // ==================== FETCH SINGLE ASSIGNMENT ====================
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
  autoAssign: async () => {
    set({ isProcessing: true, error: null });
    try {
      const response = await dormService.autoAssign();
      set({
        lastAutoAssignResult: response.data,
        isProcessing: false,
      });
      
      await get().fetchStats();
      
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
  resetDorm: async () => {
    set({ isProcessing: true, error: null });
    try {
      const response = await dormService.resetDorm(true);
      set({
        isProcessing: false,
      });
      
      await get().fetchStats();
      
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
  removeAssignment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await dormService.removeAssignment(id);
      
      set((state) => ({
        assignments: state.assignments.filter((a) => a._id !== id),
        selectedAssignment: state.selectedAssignment?._id === id ? null : state.selectedAssignment,
        isLoading: false,
      }));
      
      await get().fetchStats();
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to remove assignment',
        isLoading: false,
      });
      throw error;
    }
  },

  // ==================== ✅ EXPORT DORM STATS ====================
  exportDormStats: async (filters?: { type?: string; buildingId?: string }) => {
    set({ isExporting: true, error: null });
    try {
      const response = await dormService.exportDormStats(filters);
      
      let filename = `dorm_stats_export_${new Date().toISOString().split('T')[0]}.csv`;
      
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = window.URL.createObjectURL(blob);
      
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      set({ isExporting: false });
    } catch (error: any) {
      console.error('Export dorm stats error:', error);
      set({
        error: error.response?.data?.message || 'Failed to export dorm statistics',
        isExporting: false,
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