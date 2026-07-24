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

  // ==================== CREATE GROUP ====================
  createGroup: (data: CreateGroupData) =>
    apiClient.post<GroupResponse>('/groups', data),

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
