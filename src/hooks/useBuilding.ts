// src/lib/hooks/useBuilding.ts
'use client';

import { useEffect } from 'react';
import { useBuildingStore } from '@/src/store/building.store';
import { CreateBuildingData, UpdateBuildingData } from '@/src/types/building.types';

export const useBuilding = () => {
  const {
    buildings,
    selectedBuilding,
    selectedBuildingStats,
    isLoading,
    error,
    stats,
    fetchBuildings,
    fetchBuilding,
    createBuilding,
    updateBuilding,
    deleteBuilding,
    clearSelected,
    clearError,
  } = useBuildingStore();

  useEffect(() => {
    fetchBuildings();
  }, []);

  // Calculate building-specific stats
  const getBuildingStats = (building: any) => {
    if (!building) return null;
    return {
      totalRooms: building.total_rooms || building.room_count || 0,
      occupiedRooms: building.occupied_rooms || 0,
      availableRooms: building.available_rooms || (building.total_rooms - building.occupied_rooms) || 0,
      totalBeds: building.total_beds || building.capacity || 0,
      occupiedBeds: building.total_occupants || building.current_occupancy || 0,
      availableBeds: building.available_beds || (building.capacity - building.current_occupancy) || 0,
      occupancyRate: building.capacity > 0 
        ? Math.round(((building.current_occupancy || 0) / building.capacity) * 100) 
        : 0,
    };
  };

  return {
    buildings,
    selectedBuilding,
    selectedBuildingStats,
    isLoading,
    error,
    stats,
    fetchBuildings,
    fetchBuilding,
    createBuilding,
    updateBuilding,
    deleteBuilding,
    clearSelected,
    clearError,
    refetch: fetchBuildings,
    getBuildingStats,
  };
};