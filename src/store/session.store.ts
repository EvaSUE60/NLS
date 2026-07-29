// src/store/session.store.ts
'use client';

import { create } from 'zustand';
import {
  Session,
  CreateSessionData,
  UpdateSessionData,
  GenerateSessionsData,
  SessionFilters,
  SessionCheckInResponse,
} from '@/src/types/session.types';
import { sessionService } from '@/src/service/session.service';

interface SessionState {
  // ==================== STATE ====================
  sessions: Session[];
  selectedSession: Session | null;
  filters: SessionFilters;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
  lastCheckInResult: SessionCheckInResponse['data'] | null;

  // ==================== ACTIONS ====================
  fetchSessions: (filters?: SessionFilters) => Promise<void>;
  fetchSession: (id: string) => Promise<void>;
  createSession: (data: CreateSessionData) => Promise<Session>;
  updateSession: (id: string, data: UpdateSessionData) => Promise<Session>;
  deleteSession: (id: string) => Promise<void>;
  generateSessions: (data?: GenerateSessionsData) => Promise<void>;
  checkInAttendance: (sessionId: string, nls_id: string, method?: 'manual' | 'qr_code') => Promise<SessionCheckInResponse['data']>;

  setSelectedSession: (session: Session | null) => void;
  clearSelected: () => void;
  clearError: () => void;
  resetFilters: () => void;
}

const initialFilters: SessionFilters = {
  day: undefined,
  type: undefined,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  // ==================== INITIAL STATE ====================
  sessions: [],
  selectedSession: null,
  filters: initialFilters,
  isLoading: false,
  isProcessing: false,
  error: null,
  lastCheckInResult: null,

  // ==================== FETCH SESSIONS ====================
  fetchSessions: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      // ✅ Clean invalid filters with proper type checking
      const cleanFilters: SessionFilters = { ...filters };
      
      // ✅ Only check if day exists and is a valid number
      if (cleanFilters.day !== undefined) {
        // If day is a string, try to parse it
        if (typeof cleanFilters.day === 'string') {
          const parsed = parseInt(cleanFilters.day);
          if (isNaN(parsed) || parsed < 1 || parsed > 4) {
            delete cleanFilters.day;
          } else {
            cleanFilters.day = parsed;
          }
        }
        // If day is a number, keep it
      }
      
      const newFilters = { ...get().filters, ...cleanFilters };
      set({ filters: newFilters });

      const response = await sessionService.getSessions(newFilters);
      set({
        sessions: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch sessions',
        isLoading: false,
      });
    }
  },

  // ==================== FETCH SINGLE SESSION ====================
  fetchSession: async (id) => {
    // ✅ Guard against invalid IDs
    if (!id || id === 'create' || id === 'undefined' || id === 'null' || id === '') {
      set({ error: 'Invalid session ID', isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await sessionService.getSession(id);
      set({
        selectedSession: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch session details',
        isLoading: false,
      });
    }
  },

  // ==================== CREATE SESSION ====================
  createSession: async (data) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await sessionService.createSession(data);
      const newSession = response.data.data;
      set((state) => ({
        sessions: [...state.sessions, newSession],
        isProcessing: false,
      }));
      return newSession;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create session',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== UPDATE SESSION ====================
  updateSession: async (id, data) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await sessionService.updateSession(id, data);
      const updatedSession = response.data.data;
      set((state) => ({
        sessions: state.sessions.map((s) => (s._id === id ? updatedSession : s)),
        selectedSession: state.selectedSession?._id === id ? updatedSession : state.selectedSession,
        isProcessing: false,
      }));
      return updatedSession;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update session',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== DELETE SESSION ====================
  deleteSession: async (id) => {
    set({ isProcessing: true, error: null });
    try {
      await sessionService.deleteSession(id);
      set((state) => ({
        sessions: state.sessions.filter((s) => s._id !== id),
        selectedSession: state.selectedSession?._id === id ? null : state.selectedSession,
        isProcessing: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete session',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== GENERATE SESSIONS ====================
  generateSessions: async (data) => {
    set({ isProcessing: true, error: null });
    try {
      await sessionService.generateSessions(data);
      await get().fetchSessions();
      set({ isProcessing: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to generate sessions',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== ATTENDANCE CHECK-IN ====================
  checkInAttendance: async (sessionId, nls_id, method = 'manual') => {
    set({ isProcessing: true, error: null });
    try {
      const response = await sessionService.checkInAttendance(sessionId, { nls_id, method });
      set({
        lastCheckInResult: response.data.data,
        isProcessing: false,
      });

      // Refresh single session detail if selected
      if (get().selectedSession?._id === sessionId) {
        await get().fetchSession(sessionId);
      }
      await get().fetchSessions();

      return response.data.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to check in attendance for session',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== UTILITIES ====================
  setSelectedSession: (session) => set({ selectedSession: session }),
  clearSelected: () => set({ selectedSession: null }),
  clearError: () => set({ error: null }),
  resetFilters: () => {
    set({ filters: initialFilters });
    get().fetchSessions(initialFilters);
  },
}));