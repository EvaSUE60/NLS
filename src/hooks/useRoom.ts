// src/lib/hooks/useRoom.ts
'use client';

import { useEffect, useCallback } from 'react';
import { useRoomStore } from '@/src/store/room.store';

export const useRoom = () => {
  const {
    // ==================== STATE ====================
    rooms,
    selectedRoom,
    isLoading,
    error,
    isToggling,
    filters,
    stats,
    
    // ==================== ACTIONS ====================
    fetchRooms,
    fetchRoom,
    createRoom,
    updateRoom,
    toggleRoomStatus,
    deleteRoom,
    clearSelected,
    clearError,
    resetFilters,
  } = useRoomStore();

  // ==================== AUTO-FETCH ON MOUNT ====================
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // ==================== FILTER BY BUILDING ====================
  const filterByBuilding = useCallback((buildingId: string) => {
    return fetchRooms({ building_id: buildingId });
  }, [fetchRooms]);

  // ==================== FILTER BY FLOOR ====================
  const filterByFloor = useCallback((floor: number) => {
    return fetchRooms({ floor });
  }, [fetchRooms]);

  // ==================== FILTER BY AVAILABILITY ====================
  const filterByAvailability = useCallback((isFull: boolean) => {
    return fetchRooms({ is_full: isFull });
  }, [fetchRooms]);

  // ==================== FILTER BY BUILDING TYPE ====================
  const filterByBuildingType = useCallback((buildingType: 'men' | 'women') => {
    return fetchRooms({ building_type: buildingType });
  }, [fetchRooms]);

  // ==================== FILTER BY ACTIVE STATUS ====================
  const filterByActiveStatus = useCallback((isActive: boolean) => {
    return fetchRooms({ is_active: isActive });
  }, [fetchRooms]);

  // ==================== SHOW INACTIVE ROOMS ====================
  const showInactiveRooms = useCallback((show: boolean) => {
    return fetchRooms({ show_inactive: show ? 'true' : undefined });
  }, [fetchRooms]);

  // ==================== REFETCH ====================
  const refetch = useCallback(() => {
    return fetchRooms();
  }, [fetchRooms]);

  return {
    // ==================== STATE ====================
    rooms,
    selectedRoom,
    isLoading,
    error,
    isToggling,
    filters,
    stats,

    // ==================== FETCH ACTIONS ====================
    fetchRooms,
    fetchRoom,
    refetch,

    // ==================== CRUD ACTIONS ====================
    create: createRoom,
    update: updateRoom,
    toggleRoomStatus,
    deleteRoom: deleteRoom,

    // ==================== FILTERS ====================
    filterByBuilding,
    filterByFloor,
    filterByAvailability,
    filterByBuildingType,
    filterByActiveStatus,
    showInactiveRooms,
    resetFilters,

    // ==================== UTILITY ====================
    clearSelected,
    clearError,
  };
};