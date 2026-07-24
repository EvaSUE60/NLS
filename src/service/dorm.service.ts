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
  // POST /api/dorm/assign
  autoAssign: () =>
    apiClient.post<AutoAssignResponse>('/dorm/assign'),

  // ==================== RESET DORM ASSIGNMENTS ====================
  // POST /api/dorm/reset (requires confirm: true)
  resetDorm: (confirm: boolean = true) =>
    apiClient.post<ResetDormResponse>('/dorm/reset', { confirm }),

  // ==================== GET DORM STATS ====================
  // GET /api/dorm/stats
  getDormStats: () =>
    apiClient.get<DormStatsResponse>('/dorm/stats'),

  // ==================== GET DORM ASSIGNMENTS ====================
  // GET /api/dorm/assignments
  getAssignments: (filters?: AssignmentFilters) => {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.building_id) queryParams.append('building_id', filters.building_id);
    if (filters?.room_id) queryParams.append('room_id', filters.room_id);
    
    const queryString = queryParams.toString();
    return apiClient.get<DormAssignmentListResponse>(`/dorm/assignments${queryString ? `?${queryString}` : ''}`);
  },

  // ==================== GET ASSIGNMENT BY ID ====================
  // GET /api/dorm/assignments/[id]
  getAssignment: (id: string) =>
    apiClient.get<{ success: boolean; data: any }>(`/dorm/assignments/${id}`),

  // ==================== REMOVE ASSIGNMENT ====================
  // DELETE /api/dorm/assignments/[id]
  removeAssignment: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/dorm/assignments/${id}`),
};