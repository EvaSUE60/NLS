// src/lib/api/attendee.service.ts
'use client';

import apiClient from '@/src/lib/api/client';
import {
  Attendee,
  AttendeeFilters,
  AttendeeResponse,
  AttendeeStats,
  CreateAttendeeData,
  UpdateAttendeeData,
} from '@/src/types/attendee.types';

export const attendeeService = {
  // ==================== GET ALL ATTENDEES ====================
  getAttendees: (filters?: AttendeeFilters) => {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.search) params.append('search', filters.search);
    if (filters?.region) params.append('region', filters.region);
    if (filters?.gender) params.append('gender', filters.gender);
    if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    if (filters?.arrived !== undefined) params.append('arrived', String(filters.arrived));

    const queryString = params.toString();
    return apiClient.get<AttendeeResponse>(`/attendees${queryString ? `?${queryString}` : ''}`);
  },

  // ==================== GET SINGLE ATTENDEE ====================
  getAttendee: (id: string) =>
    apiClient.get<{ success: boolean; data: Attendee }>(`/attendees/${id}`),

  // ==================== GET ATTENDEE BY NLS ID ====================
  getAttendeeByNLS: (nlsId: string) =>
    apiClient.get<{ success: boolean; data: { attendees: Attendee[] } }>(
      `/attendees/search?q=${nlsId}&by=unique_id`
    ),

  // ==================== CREATE ATTENDEE ====================
  createAttendee: (data: CreateAttendeeData) =>
    apiClient.post<{ success: boolean; data: Attendee }>('/attendees', data),

  // ==================== UPDATE ATTENDEE ====================
  updateAttendee: (id: string, data: UpdateAttendeeData) =>
    apiClient.put<{ success: boolean; data: Attendee }>(`/attendees/${id}`, data),

  // ==================== DELETE ATTENDEE ====================
  deleteAttendee: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/attendees/${id}`),

  // ==================== ARRIVAL CHECK-IN ====================
  checkInArrival: (id: string, method: 'manual' | 'bulk' | 'qr_code' = 'manual') =>
    apiClient.post<{ success: boolean; data: Attendee }>(`/attendees/${id}/arrival`, { method }),

  // ==================== BULK ARRIVAL CHECK-IN ====================
  bulkCheckIn: (attendeeIds: string[], method: 'manual' | 'bulk' = 'bulk') =>
    apiClient.post<{ success: boolean; data: { processed: number; attendees: Attendee[] } }>(
      '/attendees/bulk-arrival',
      { attendeeIds, method }
    ),

  // ==================== ARRIVAL STATISTICS ====================
  getArrivalStats: () =>
    apiClient.get<{ success: boolean; data: AttendeeStats }>('/attendees/stats/arrival'),

  // ==================== SEARCH ATTENDEES ====================
  searchAttendees: (query: string, by?: 'unique_id' | 'name' | 'email' | 'phone') => {
    const params = new URLSearchParams({ q: query });
    if (by) params.append('by', by);
    return apiClient.get<{ success: boolean; data: { attendees: Attendee[]; count: number } }>(
      `/attendees/search?${params.toString()}`
    );
  },

  // ==================== IMPORT ATTENDEES ====================
  importAttendees: () =>
    apiClient.post<{
      success: boolean;
      message: string;
      data: {
        imported: number;
        total: number;
        skipped: number;
        total_attendees: number;
        assigned_attendees: number;
        unassigned_attendees: number;
        stats: { total: number; by_region: Array<{ _id: string; count: number }> };
      };
    }>('/attendees/import'),
};