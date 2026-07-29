// src/service/group.service.ts
'use client';

import apiClient from '@/src/lib/api/client';
import {
  CreateGroupData,
  AutoAssignGroupsRequest,
  UpdatePointsRequest,
  GroupsListResponse,
  GroupResponse,
  GroupStats,
  AutoAssignGroupsResponse,
  GroupAssignResponse,
  GroupRemoveResponse,
  GroupPointsResponse,
  GroupActivitiesResponse,
} from '@/src/types/group.types';

export const groupService = {
  // ==================== GET ALL GROUPS ====================
  getGroups: (isActive?: boolean) => {
    const queryString = isActive !== undefined ? `?isActive=${isActive}` : '';
    return apiClient.get<GroupsListResponse>(`/groups${queryString}`);
  },

  // ==================== GET SINGLE GROUP ====================
  getGroup: (id: string) =>
    apiClient.get<GroupResponse>(`/groups/${id}`),

  // ==================== CREATE GROUP ====================
  createGroup: (data: CreateGroupData) =>
    apiClient.post<GroupResponse>('/groups', data),

  // ==================== UPDATE GROUP ====================
  updateGroup: (id: string, data: Partial<CreateGroupData>) =>
    apiClient.put<GroupResponse>(`/groups/${id}`, data),

  // ==================== DELETE GROUP ====================
  deleteGroup: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/groups/${id}`),

  // ==================== BULK CREATE GROUPS ====================
  bulkCreateGroups: (data: {
    count: number;
    max_size?: number;
    name_prefix?: string;
    description?: string;
    start_from?: number;
  }) =>
    apiClient.post<{
      success: boolean;
      message: string;
      data: {
        created: any[];
        skipped: string[];
        summary: {
          total_requested: number;
          created: number;
          skipped: number;
          total_groups: number;
          total_capacity: number;
          max_size: number;
        };
      };
    }>('/groups/bulk', data),

  // ==================== RESET GROUPS (Clear members) ====================
  resetGroups: (data: { confirm: boolean }) =>
    apiClient.post<{
      success: boolean;
      message: string;
      data: {
        before: any;
        after: any;
        changes: any;
      };
    }>('/groups/reset', data),

  // ==================== BULK RESET GROUPS (Delete) ====================
  bulkResetGroups: (data: { confirm: boolean; deleteAll?: boolean; groupIds?: string[] }) =>
    apiClient.post<{
      success: boolean;
      message: string;
      data: {
        deleted_groups: string[];
        deleted_count: number;
        before: any;
        after: any;
        changes: any;
      };
    }>('/groups/bulk-reset', data),

  // ==================== AUTO-ASSIGN GROUPS ====================
  autoAssignGroups: (data: AutoAssignGroupsRequest = {}) =>
    apiClient.post<AutoAssignGroupsResponse>('/groups/auto-assign', data),

  // ==================== GET GROUP STATS ====================
  getGroupStats: () =>
    apiClient.get<{ success: boolean; data: GroupStats }>('/groups/stats'),

  // ==================== ASSIGN ATTENDEE TO GROUP ====================
  assignAttendee: (groupId: string, nls_id: string) =>
    apiClient.post<GroupAssignResponse>(`/groups/${groupId}/assign`, { nls_id }),

  // ==================== REMOVE ATTENDEE FROM GROUP ====================
  removeAttendee: (groupId: string, nls_id: string) =>
    apiClient.post<GroupRemoveResponse>(`/groups/${groupId}/remove`, { nls_id }),

  // ==================== UPDATE GROUP POINTS ====================
  updatePoints: (groupId: string, data: UpdatePointsRequest) =>
    apiClient.post<GroupPointsResponse>(`/groups/${groupId}/points`, data),

  // ==================== GET GROUP ACTIVITIES ====================
  getActivities: (groupId: string) =>
    apiClient.get<GroupActivitiesResponse>(`/groups/${groupId}/points`),
};