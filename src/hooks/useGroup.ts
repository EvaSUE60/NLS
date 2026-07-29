// src/hooks/useGroup.ts
'use client';

import { useEffect } from 'react';
import { useGroupStore } from '@/src/store/group.store';
import { CreateGroupData, AutoAssignGroupsRequest, UpdatePointsRequest } from '@/src/types/group.types';

export const useGroup = (autoFetch: boolean = true) => {
  const {
    // ==================== STATE ====================
    groups,
    selectedGroup,
    activities,
    stats,
    lastAutoAssignResult,
    isLoading,
    isProcessing,
    error,

    // ==================== FETCH ACTIONS ====================
    fetchGroups,
    fetchGroup,
    fetchStats,
    fetchActivities,

    // ==================== CRUD ACTIONS ====================
    createGroup,
    updateGroup,
    deleteGroup,

    // ==================== BULK OPERATIONS ====================
    bulkCreateGroups,
    resetGroups,
    bulkResetGroups,

    // ==================== AUTO-ASSIGN ====================
    autoAssignGroups,

    // ==================== MEMBER OPERATIONS ====================
    assignAttendee,
    removeAttendee,

    // ==================== POINTS OPERATIONS ====================
    updatePoints,

    // ==================== UTILITIES ====================
    setSelectedGroup,
    clearError,
    clearSelected, // ✅ Add this here
  } = useGroupStore();

  // ==================== AUTO-FETCH ON MOUNT ====================
  useEffect(() => {
    if (autoFetch) {
      fetchGroups();
      fetchStats();
    }
  }, [autoFetch]);

  // ==================== REFETCH ====================
  const refetch = (isActive?: boolean) => {
    return fetchGroups(isActive);
  };

  return {
    // ==================== STATE ====================
    groups,
    selectedGroup,
    activities,
    stats,
    lastAutoAssignResult,
    isLoading,
    isProcessing,
    error,

    // ==================== FETCH ACTIONS ====================
    fetchGroups,
    fetchGroup,
    fetchStats,
    fetchActivities,
    refetch,

    // ==================== CRUD ACTIONS ====================
    create: createGroup,
    update: updateGroup,
    delete: deleteGroup,

    // ==================== BULK OPERATIONS ====================
    bulkCreate: bulkCreateGroups,
    reset: resetGroups,
    bulkReset: bulkResetGroups,

    // ==================== AUTO-ASSIGN ====================
    autoAssign: autoAssignGroups,

    // ==================== MEMBER OPERATIONS ====================
    assign: assignAttendee,
    remove: removeAttendee,

    // ==================== POINTS OPERATIONS ====================
    updatePoints,

    // ==================== UTILITIES ====================
    setSelectedGroup,
    clearError,
    clearSelected, // ✅ Add this here
  };
};