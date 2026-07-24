// src/service/seminar.service.ts
'use client';

import apiClient from '@/src/lib/api/client';
import {
  Seminar,
  CreateSeminarData,
  UpdateSeminarData,
  GenerateSeminarsData,
  SeminarFilters,
  SeminarStats,
  SeminarsListResponse,
  SeminarResponse,
  SeminarParticipantsResponse,
  SeminarRegisterResponse,
  SeminarAttendanceCheckInResponse,
} from '@/src/types/seminar.types';

export const seminarService = {
  // ==================== GET ALL SEMINARS ====================
  getSeminars: (filters?: SeminarFilters) => {
    const params = new URLSearchParams();
    if (filters?.day) params.append('day', String(filters.day));
    if (filters?.seminar_key) params.append('seminar_key', filters.seminar_key);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.date) params.append('date', filters.date);

    const queryString = params.toString();
    return apiClient.get<SeminarsListResponse>(`/seminars${queryString ? `?${queryString}` : ''}`);
  },

  // ==================== GET SINGLE SEMINAR ====================
  getSeminar: (id: string) =>
    apiClient.get<SeminarResponse>(`/seminars/${id}`),

  // ==================== CREATE SEMINAR ====================
  createSeminar: (data: CreateSeminarData) =>
    apiClient.post<SeminarResponse>('/seminars', data),

  // ==================== UPDATE SEMINAR ====================
  updateSeminar: (id: string, data: UpdateSeminarData) =>
    apiClient.put<SeminarResponse>(`/seminars/${id}`, data),

  // ==================== DELETE SEMINAR ====================
  deleteSeminar: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/seminars/${id}`),

  // ==================== GENERATE SEMINARS ====================
  generateSeminars: (data: GenerateSeminarsData) =>
    apiClient.post<{
      success: boolean;
      message: string;
      data: {
        created: number;
        skipped: number;
        errors?: any[];
        total_seminars: number;
        days_processed: number;
        seminars_per_day: number;
      };
    }>('/seminars/generate', data),

  // ==================== GET SEMINAR STATS ====================
  getSeminarStats: (day?: number) => {
    const queryString = day ? `?day=${day}` : '';
    return apiClient.get<{ success: boolean; data: SeminarStats }>(`/seminars/stats${queryString}`);
  },

  // ==================== GET SEMINAR PARTICIPANTS ====================
  getParticipants: (id: string, attended?: boolean) => {
    const queryString = attended !== undefined ? `?attended=${attended}` : '';
    return apiClient.get<SeminarParticipantsResponse>(`/seminars/${id}/participants${queryString}`);
  },

  // ==================== REGISTER ATTENDEE FOR SEMINAR ====================
  registerAttendee: (id: string, nls_id: string) =>
    apiClient.post<SeminarRegisterResponse>(`/seminars/${id}/register`, { nls_id }),

  // ==================== CHECK-IN ATTENDEE TO SEMINAR ====================
  checkInAttendance: (id: string, nls_id: string, method: 'manual' | 'qr_code' = 'manual') =>
    apiClient.post<SeminarAttendanceCheckInResponse>(`/seminars/${id}/attendance`, {
      nls_id,
      method,
    }),
};
