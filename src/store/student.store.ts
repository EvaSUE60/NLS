// src/lib/stores/student.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StudentInfoResponse } from '@/src/service/student.service';

interface StudentState {
  // State
  currentStudentNlsId: string | null;
  studentData: StudentInfoResponse | null;
  isLoading: boolean;
  error: string | null;
  searchHistory: string[];

  // Actions
  setNlsId: (nlsId: string) => void;
  setStudentData: (data: StudentInfoResponse) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addToHistory: (nlsId: string) => void;
  clearStudent: () => void;
  clearHistory: () => void;
}

export const useStudentStore = create<StudentState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStudentNlsId: null,
      studentData: null,
      isLoading: false,
      error: null,
      searchHistory: [],

      // Actions
      setNlsId: (nlsId) => {
        set({ currentStudentNlsId: nlsId });
        get().addToHistory(nlsId);
      },

      setStudentData: (data) => {
        set({ studentData: data, error: null });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error });
      },

      addToHistory: (nlsId) => {
        const { searchHistory } = get();
        const filtered = searchHistory.filter((id) => id !== nlsId);
        const newHistory = [nlsId, ...filtered].slice(0, 10); // Keep last 10
        set({ searchHistory: newHistory });
      },

      clearStudent: () => {
        set({
          currentStudentNlsId: null,
          studentData: null,
          error: null,
        });
      },

      clearHistory: () => {
        set({ searchHistory: [] });
      },
    }),
    {
      name: 'student-storage', // persist to localStorage
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        currentStudentNlsId: state.currentStudentNlsId,
      }),
    }
  )
);