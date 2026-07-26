// src/lib/hooks/useRoom.ts
'use client';

import { useEffect } from 'react';
import { useRoomStore } from '@/src/store/room.store';
import { CreateRoomData, UpdateRoomData } from '@/src/types/room.types';

export const useRoom = () => {
  const {
    // ==================== STATE ====================
    rooms,
    selectedRoom,
    isLoading,
    error,
    filters,
    stats,
    
    // ==================== ACTIONS ====================
    fetchRooms,  // ✅ Make sure this is destructured
    fetchRoom,
    createRoom,
    updateRoom,
    deleteRoom,
    clearSelected,
    clearError,
    resetFilters,
  } = useRoomStore();

  // ==================== AUTO-FETCH ON MOUNT ====================
  useEffect(() => {
    fetchRooms();  // ✅ This should work if fetchRooms exists in the store
  }, []);

  // ==================== FILTER BY BUILDING ====================
  const filterByBuilding = (buildingId: string) => {
    return fetchRooms({ building_id: buildingId });
  };

  // ==================== FILTER BY FLOOR ====================
  const filterByFloor = (floor: number) => {
    return fetchRooms({ floor });
  };

  // ==================== FILTER BY AVAILABILITY ====================
  const filterByAvailability = (isFull: boolean) => {
    return fetchRooms({ is_full: isFull });
  };

  // ==================== FILTER BY BUILDING TYPE ====================
  const filterByBuildingType = (buildingType: 'men' | 'women') => {
    return fetchRooms({ building_type: buildingType });
  };

  // ==================== REFETCH ====================
  const refetch = () => {
    return fetchRooms();
  };

  return {
    // ==================== STATE ====================
    rooms,
    selectedRoom,
    isLoading,
    error,
    filters,
    stats,

    // ==================== FETCH ACTIONS ====================
    fetchRooms,  // ✅ Expose fetchRooms
    fetchRoom,
    refetch,

    // ==================== CRUD ACTIONS ====================
    create: createRoom,
    update: updateRoom,
    deleteRoom: deleteRoom,

    // ==================== FILTERS ====================
    filterByBuilding,
    filterByFloor,
    filterByAvailability,
    filterByBuildingType,
    resetFilters,

    // ==================== UTILITY ====================
    clearSelected,
    clearError,
  };
};