// src/hooks/useGroup.ts
'use client';

import { useEffect } from 'react';
import { useGroupStore } from '@/src/store/group.store';
import { CreateGroupData, AutoAssignGroupsRequest, UpdatePointsRequest } from '@/src/types/group.types';

export const useGroup = (autoFetch: boolean = true) => {
  const {
    groups,
    selectedGroup,
    activities,
    stats,
    lastAutoAssignResult,
    isLoading,
    isProcessing,
    error,

    fetchGroups,
    createGroup,
    autoAssignGroups,
    fetchStats,
    assignAttendee,
    removeAttendee,
    updatePoints,
    fetchActivities,
    setSelectedGroup,
    clearError,
  } = useGroupStore();

  useEffect(() => {
    if (autoFetch) {
      fetchGroups();
      fetchStats();
    }
  }, [autoFetch]);

  return {
    // State
    groups,
    selectedGroup,
    activities,
    stats,
    lastAutoAssignResult,
    isLoading,
    isProcessing,
    error,

    // Methods
    fetchGroups,
    create: createGroup,
    autoAssign: autoAssignGroups,
    fetchStats,
    assignAttendee,
    removeAttendee,
    updatePoints,
    fetchActivities,

    // Selection & Utilities
    setSelectedGroup,
    clearError,
  };
};
