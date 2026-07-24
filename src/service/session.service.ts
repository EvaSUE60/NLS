// src/service/session.service.ts
'use client';

import apiClient from '@/src/lib/api/client';
import {
  CreateSessionData,
  UpdateSessionData,
  GenerateSessionsData,
  SessionFilters,
  SessionCheckInRequest,
  SessionsListResponse,
  SessionResponse,
  SessionCheckInResponse,
} from '@/src/types/session.types';

export const sessionService = {
  // ==================== GET ALL SESSIONS ====================
  getSessions: (filters?: SessionFilters) => {
    const params = new URLSearchParams();
    if (filters?.day) params.append('day', String(filters.day));
    if (filters?.type) params.append('type', filters.type);

    const queryString = params.toString();
    return apiClient.get<SessionsListResponse>(`/sessions${queryString ? `?${queryString}` : ''}`);
  },

  // ==================== GET SINGLE SESSION ====================
  getSession: (id: string) =>
    apiClient.get<SessionResponse>(`/sessions/${id}`),

  // ==================== CREATE SESSION ====================
  createSession: (data: CreateSessionData) =>
    apiClient.post<SessionResponse>('/sessions', data),

  // ==================== UPDATE SESSION ====================
  updateSession: (id: string, data: UpdateSessionData) =>
    apiClient.put<SessionResponse>(`/sessions/${id}`, data),

  // ==================== DELETE SESSION ====================
  deleteSession: (id: string) =>
    apiClient.delete<{
      success: boolean;
      message: string;
      data: {
        session_id: string;
        name: string;
        day: number;
        type: string;
      };
    }>(`/sessions/${id}`),

  // ==================== GENERATE SESSIONS ====================
  generateSessions: (data: GenerateSessionsData = {}) =>
    apiClient.post<{
      success: boolean;
      message: string;
      data: {
        created: number;
        skipped: number;
        errors?: any[];
        total_sessions: number;
        days_processed: number;
        sessions_per_day: number;
      };
    }>('/sessions/generate', data),

  // ==================== SESSION ATTENDANCE CHECK-IN ====================
  checkInAttendance: (sessionId: string, data: SessionCheckInRequest) =>
    apiClient.post<SessionCheckInResponse>(`/sessions/${sessionId}/attendance`, data),
};
