// src/store/group.store.ts
'use client';

import { create } from 'zustand';
import {
  Group,
  CreateGroupData,
  AutoAssignGroupsRequest,
  UpdatePointsRequest,
  GroupStats,
  GroupActivity,
  AutoAssignGroupsResponse,
} from '@/src/types/group.types';
import { groupService } from '@/src/service/group.service';

interface GroupState {
  // ==================== STATE ====================
  groups: Group[];
  selectedGroup: Group | null;
  activities: GroupActivity[];
  stats: GroupStats | null;
  lastAutoAssignResult: AutoAssignGroupsResponse['data'] | null;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;

  // ==================== ACTIONS ====================
  fetchGroups: (isActive?: boolean) => Promise<void>;
  createGroup: (data: CreateGroupData) => Promise<Group>;
  autoAssignGroups: (data?: AutoAssignGroupsRequest) => Promise<AutoAssignGroupsResponse['data']>;
  fetchStats: () => Promise<void>;
  assignAttendee: (groupId: string, nls_id: string) => Promise<void>;
  removeAttendee: (groupId: string, nls_id: string) => Promise<void>;
  updatePoints: (groupId: string, data: UpdatePointsRequest) => Promise<void>;
  fetchActivities: (groupId: string) => Promise<void>;

  setSelectedGroup: (group: Group | null) => void;
  clearError: () => void;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  // ==================== INITIAL STATE ====================
  groups: [],
  selectedGroup: null,
  activities: [],
  stats: null,
  lastAutoAssignResult: null,
  isLoading: false,
  isProcessing: false,
  error: null,

  // ==================== FETCH GROUPS ====================
  fetchGroups: async (isActive) => {
    set({ isLoading: true, error: null });
    try {
      const response = await groupService.getGroups(isActive);
      set({
        groups: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch groups',
        isLoading: false,
      });
    }
  },

  // ==================== CREATE GROUP ====================
  createGroup: async (data) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await groupService.createGroup(data);
      const newGroup = response.data.data;
      set((state) => ({
        groups: [...state.groups, newGroup],
        isProcessing: false,
      }));
      return newGroup;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create group',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== AUTO-ASSIGN GROUPS ====================
  autoAssignGroups: async (data) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await groupService.autoAssignGroups(data);
      set({
        lastAutoAssignResult: response.data.data,
        isProcessing: false,
      });

      // Refresh groups list & stats
      await get().fetchGroups();
      await get().fetchStats();

      return response.data.data;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to auto-assign groups',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== FETCH STATS ====================
  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await groupService.getGroupStats();
      set({
        stats: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch group statistics',
        isLoading: false,
      });
    }
  },

  // ==================== ASSIGN ATTENDEE ====================
  assignAttendee: async (groupId, nls_id) => {
    set({ isProcessing: true, error: null });
    try {
      await groupService.assignAttendee(groupId, nls_id);
      await get().fetchGroups();
      await get().fetchStats();
      set({ isProcessing: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to assign attendee to group',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== REMOVE ATTENDEE ====================
  removeAttendee: async (groupId, nls_id) => {
    set({ isProcessing: true, error: null });
    try {
      await groupService.removeAttendee(groupId, nls_id);
      await get().fetchGroups();
      await get().fetchStats();
      set({ isProcessing: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to remove attendee from group',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== UPDATE POINTS ====================
  updatePoints: async (groupId, data) => {
    set({ isProcessing: true, error: null });
    try {
      await groupService.updatePoints(groupId, data);
      await get().fetchGroups();
      await get().fetchActivities(groupId);
      await get().fetchStats();
      set({ isProcessing: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update group points',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== FETCH ACTIVITIES ====================
  fetchActivities: async (groupId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await groupService.getActivities(groupId);
      set({
        activities: response.data.data.activities,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch group activities',
        isLoading: false,
      });
    }
  },

  // ==================== UTILITIES ====================
  setSelectedGroup: (group) => set({ selectedGroup: group }),
  clearError: () => set({ error: null }),
}));
