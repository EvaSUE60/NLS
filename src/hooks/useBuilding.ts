// src/lib/hooks/useBuilding.ts
'use client';

import { useEffect } from 'react';
import { useBuildingStore } from '@/src/store/building.store';
import { CreateBuildingData, UpdateBuildingData } from '@/src/types/building.types';

export const useBuilding = () => {
  const {
    buildings,
    selectedBuilding,
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

  return {
    buildings,
    selectedBuilding,
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
  };
};