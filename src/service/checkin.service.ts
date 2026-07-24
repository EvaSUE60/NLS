// src/lib/api/checkin.service.ts
'use client';

import apiClient from '@/src/lib/api/client';
import {
  ArrivalCheckInRequest,
  ArrivalCheckInResponse,
  BulkCheckInRequest,
  BulkCheckInResponse,
  SessionCheckInRequest,
  SessionCheckInResponse,
  SeminarCheckInRequest,
  SeminarCheckInResponse,
  AttendeeSearchResponse,
  CheckInStats,
  SessionAttendanceResponse,
  SeminarAttendanceResponse,
} from '@/src/types/checkin.types';

export const checkinService = {
  // ==================== ARRIVAL CHECK-IN ====================

  // Single arrival check-in
  checkInArrival: (data: ArrivalCheckInRequest) =>
    apiClient.post<ArrivalCheckInResponse>(`/attendees/${data.attendeeId}/arrival`, {
      method: data.method || 'manual',
    }),

  // Bulk arrival check-in
  bulkCheckIn: (data: BulkCheckInRequest) =>
    apiClient.post<BulkCheckInResponse>('/attendees/bulk-arrival', {
      attendeeIds: data.attendeeIds,
      method: data.method || 'bulk',
    }),

  // ==================== SEARCH ATTENDEE ====================

  // Search attendee by NLS ID, name, email, or phone
  searchAttendee: (query: string, by?: 'unique_id' | 'name' | 'email' | 'phone') => {
    const params = new URLSearchParams({ q: query });
    if (by) params.append('by', by);
    return apiClient.get<AttendeeSearchResponse>(`/attendees/search?${params.toString()}`);
  },

  // ==================== CHECK-IN STATS ====================

  // Get arrival statistics
  getArrivalStats: () =>
    apiClient.get<{ success: boolean; data: CheckInStats }>('/attendees/arrival-stats'),

  // ==================== SESSION CHECK-IN ====================

  // Check-in attendee to session
  checkInSession: (data: SessionCheckInRequest) =>
    apiClient.post<SessionCheckInResponse>(`/sessions/${data.sessionId}/attendance`, {
      nls_id: data.nls_id,
      method: data.method || 'manual',
    }),

  // Get session attendance for attendee
  getSessionAttendance: (attendeeId: string) =>
    apiClient.get<SessionAttendanceResponse>(`/attendees/${attendeeId}/sessions`),

  // ==================== SEMINAR CHECK-IN ====================

  // Check-in attendee to seminar
  checkInSeminar: (data: SeminarCheckInRequest) =>
    apiClient.post<SeminarCheckInResponse>(`/seminars/${data.seminarId}/attendance`, {
      nls_id: data.nls_id,
      method: data.method || 'manual',
    }),

  // Get seminar attendance for attendee
  getSeminarAttendance: (attendeeId: string) =>
    apiClient.get<SeminarAttendanceResponse>(`/attendees/${attendeeId}/seminars`),
};