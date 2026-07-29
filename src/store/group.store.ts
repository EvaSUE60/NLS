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
  fetchGroup: (id: string) => Promise<void>;
  createGroup: (data: CreateGroupData) => Promise<Group>;
  updateGroup: (id: string, data: Partial<CreateGroupData>) => Promise<Group>;
  deleteGroup: (id: string) => Promise<void>;
  
  autoAssignGroups: (data?: AutoAssignGroupsRequest) => Promise<AutoAssignGroupsResponse['data']>;
  fetchStats: () => Promise<void>;
  assignAttendee: (groupId: string, nls_id: string) => Promise<void>;
  removeAttendee: (groupId: string, nls_id: string) => Promise<void>;
  updatePoints: (groupId: string, data: UpdatePointsRequest) => Promise<void>;
  fetchActivities: (groupId: string) => Promise<void>;

  // Bulk Operations
  bulkCreateGroups: (data: {
    count: number;
    max_size?: number;
    name_prefix?: string;
    description?: string;
    start_from?: number;
  }) => Promise<{
    created: Group[];
    skipped: string[];
    summary: {
      total_requested: number;
      created: number;
      skipped: number;
      total_groups: number;
      total_capacity: number;
      max_size: number;
    };
  }>;

  resetGroups: (data: { confirm: boolean }) => Promise<void>;
  bulkResetGroups: (data: { confirm: boolean; deleteAll?: boolean; groupIds?: string[] }) => Promise<{
    deletedCount: number;
    deletedGroups: string[];
  }>;

  setSelectedGroup: (group: Group | null) => void;
  clearError: () => void;
  clearSelected: () => void; // ✅ Add this
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

  // ==================== FETCH SINGLE GROUP ====================
  fetchGroup: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await groupService.getGroup(id);
      set({
        selectedGroup: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch group',
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

  // ==================== UPDATE GROUP ====================
  updateGroup: async (id, data) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await groupService.updateGroup(id, data);
      const updatedGroup = response.data.data;
      set((state) => ({
        groups: state.groups.map((g) => (g._id === id ? updatedGroup : g)),
        selectedGroup: state.selectedGroup?._id === id ? updatedGroup : state.selectedGroup,
        isProcessing: false,
      }));
      return updatedGroup;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update group',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== DELETE GROUP ====================
  deleteGroup: async (id) => {
    set({ isProcessing: true, error: null });
    try {
      await groupService.deleteGroup(id);
      set((state) => ({
        groups: state.groups.filter((g) => g._id !== id),
        selectedGroup: state.selectedGroup?._id === id ? null : state.selectedGroup,
        isProcessing: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete group',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== BULK CREATE GROUPS ====================
  bulkCreateGroups: async (data) => {
    set({ isProcessing: true, error: null });
    try {
      const response = await groupService.bulkCreateGroups(data);
      
      await get().fetchGroups();
      await get().fetchStats();
      
      set({ isProcessing: false });
      
      return {
        created: response.data.data.created || [],
        skipped: response.data.data.skipped || [],
        summary: response.data.data.summary,
      };
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create groups',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== RESET GROUPS ====================
  resetGroups: async (data) => {
    if (!data.confirm) {
      throw new Error('Confirmation required to reset groups');
    }
    
    set({ isProcessing: true, error: null });
    try {
      await groupService.resetGroups(data);
      
      await get().fetchGroups();
      await get().fetchStats();
      
      set({ isProcessing: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to reset groups',
        isProcessing: false,
      });
      throw error;
    }
  },

  // ==================== BULK RESET GROUPS ====================
  bulkResetGroups: async (data) => {
    if (!data.confirm) {
      throw new Error('Confirmation required to delete groups');
    }
    
    set({ isProcessing: true, error: null });
    try {
      const response = await groupService.bulkResetGroups(data);
      
      await get().fetchGroups();
      await get().fetchStats();
      
      set({ isProcessing: false });
      
      return {
        deletedCount: response.data.data.deleted_count,
        deletedGroups: response.data.data.deleted_groups,
      };
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete groups',
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
      
      const { selectedGroup } = get();
      if (selectedGroup && selectedGroup._id === groupId) {
        await get().fetchGroup(groupId);
      }
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
      
      const { selectedGroup } = get();
      if (selectedGroup && selectedGroup._id === groupId) {
        await get().fetchGroup(groupId);
      }
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
      
      const { selectedGroup } = get();
      if (selectedGroup && selectedGroup._id === groupId) {
        await get().fetchGroup(groupId);
      }
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
        activities: response.data.data.activities || [],
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
  clearSelected: () => set({ selectedGroup: null, activities: [] }), // ✅ Add this
}));