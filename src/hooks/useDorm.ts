// src/lib/hooks/useDorm.ts
'use client';

import { useEffect } from 'react';
import { useDormStore } from '@/src/store/dorm.store';
import { AssignmentFilters } from '@/src/types/dorm.types';

export const useDorm = () => {
  const {
    // ==================== STATE ====================
    stats,
    assignments,
    selectedAssignment,
    isLoading,
    error,
    isProcessing,
    isExporting, // ✅ Add this
    lastAutoAssignResult,
    filters,

    // ==================== ACTIONS ====================
    fetchStats,
    fetchAssignments,
    fetchAssignment,
    autoAssign,
    resetDorm,
    removeAssignment,
    exportDormStats, // ✅ Add this
    clearSelected,
    clearError,
    setFilters,
    resetFilters,
  } = useDormStore();

  // ==================== AUTO-FETCH ON MOUNT ====================
  useEffect(() => {
    fetchStats();
    // ✅ Remove automatic assignment fetch - this endpoint doesn't exist
    // fetchAssignments();
  }, []);

  // ==================== FILTER BY STATUS ====================
  const filterByStatus = (status: 'active' | 'cancelled' | 'changed') => {
    setFilters({ status });
  };

  // ==================== FILTER BY BUILDING ====================
  const filterByBuilding = (buildingId: string) => {
    setFilters({ building_id: buildingId });
  };

  // ==================== REFRESH ====================
  const refresh = () => {
    fetchStats();
    // Don't fetch assignments
  };

  // ==================== GET STATS SUMMARY ====================
  const getStatsSummary = () => {
    if (!stats) return null;
    
    return {
      totalBuildings: stats.buildings.total,
      totalRooms: stats.rooms.total,
      totalBeds: stats.beds.total,
      occupiedBeds: stats.beds.occupied,
      occupancyRate: stats.beds.occupancy_rate,
      activeAssignments: stats.assignments.active,
      assignedAttendees: stats.attendees.assigned,
      unassignedAttendees: stats.attendees.unassigned,
    };
  };

  // ==================== EXPORT ====================
  const exportStats = async (filters?: { type?: string; buildingId?: string }) => {
    return exportDormStats(filters);
  };

  return {
    // ==================== STATE ====================
    stats,
    assignments,
    selectedAssignment,
    isLoading,
    error,
    isProcessing,
    isExporting, // ✅ Add this
    lastAutoAssignResult,
    filters,

    // ==================== FETCH ACTIONS ====================
    fetchStats,
    fetchAssignments,
    fetchAssignment,
    refresh,

    // ==================== DORM ACTIONS ====================
    autoAssign,
    resetDorm,
    removeAssignment,

    // ==================== EXPORT ====================
    exportStats, // ✅ Add this

    // ==================== FILTERS ====================
    filterByStatus,
    filterByBuilding,
    setFilters,
    resetFilters,

    // ==================== UTILITY ====================
    clearSelected,
    clearError,
    getStatsSummary,
  };
};