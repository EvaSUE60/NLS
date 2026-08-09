// src/lib/api/dorm.service.ts
'use client';

import apiClient from '@/src/lib/api/client';
import {
  DormStatsResponse,
  DormAssignmentListResponse,
  AutoAssignResponse,
  ResetDormResponse,
  AssignmentFilters,
} from '@/src/types/dorm.types';

export const dormService = {
  // ==================== AUTO-ASSIGN ATTENDEES ====================
  autoAssign: () =>
    apiClient.post<AutoAssignResponse>('/dorm/assign'),

  // ==================== RESET DORM ASSIGNMENTS ====================
  resetDorm: (confirm: boolean = true) =>
    apiClient.post<ResetDormResponse>('/dorm/reset', { confirm }),

  // ==================== GET DORM STATS ====================
  getDormStats: () =>
    apiClient.get<DormStatsResponse>('/dorm/stats'),

  // ==================== GET DORM ASSIGNMENTS ====================
  getAssignments: (filters?: AssignmentFilters) => {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.building_id) queryParams.append('building_id', filters.building_id);
    if (filters?.room_id) queryParams.append('room_id', filters.room_id);
    
    const queryString = queryParams.toString();
    return apiClient.get<DormAssignmentListResponse>(`/dorm/assignments${queryString ? `?${queryString}` : ''}`);
  },

  // ==================== GET ASSIGNMENT BY ID ====================
  getAssignment: (id: string) =>
    apiClient.get<{ success: boolean; data: any }>(`/dorm/assignments/${id}`),

  // ==================== REMOVE ASSIGNMENT ====================
  removeAssignment: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/dorm/assignments/${id}`),

  // ==================== ✅ EXPORT DORM STATS ====================
  exportDormStats: (filters?: { type?: string; buildingId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.buildingId) params.append('buildingId', filters.buildingId);

    const queryString = params.toString();
    return apiClient.get(`/dorm/export${queryString ? `?${queryString}` : ''}`, {
      responseType: 'blob',
    });
  },
};