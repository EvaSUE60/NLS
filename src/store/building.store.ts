// src/lib/stores/building.store.ts
'use client';

import { create } from 'zustand';
import { Building, CreateBuildingData, UpdateBuildingData } from '@/src/types/building.types';
import { buildingService } from '@/src/service/building.service';

interface BuildingState {
  // States
  buildings: Building[];
  selectedBuilding: Building | null;
  isLoading: boolean;
  error: string | null;
  stats: {
    total: number;
    men: number;
    women: number;
  } | null;

  // Actions
  fetchBuildings: () => Promise<void>;
  fetchBuilding: (id: string) => Promise<void>;
  createBuilding: (data: CreateBuildingData) => Promise<Building>;
  updateBuilding: (id: string, data: UpdateBuildingData) => Promise<Building>;
  deleteBuilding: (id: string) => Promise<void>;
  clearSelected: () => void;
  clearError: () => void;
}

export const useBuildingStore = create<BuildingState>((set, get) => ({
  buildings: [],
  selectedBuilding: null,
  isLoading: false,
  error: null,
  stats: null,

  // GET /api/buildings
  fetchBuildings: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await buildingService.getBuildings();
      const buildings = response.data.data;
      
      const stats = {
        total: buildings.length,
        men: buildings.filter((b) => b.type === 'men').length,
        women: buildings.filter((b) => b.type === 'women').length,
      };

      set({ buildings, stats, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch buildings',
        isLoading: false,
      });
    }
  },

  // GET /api/buildings/[id]
  fetchBuilding: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await buildingService.getBuilding(id);
      set({ selectedBuilding: response.data.data, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch building',
        isLoading: false,
      });
    }
  },

  // POST /api/buildings
  createBuilding: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await buildingService.createBuilding(data);
      const newBuilding = response.data.data;
      await get().fetchBuildings();
      set({ isLoading: false });
      return newBuilding;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create building',
        isLoading: false,
      });
      throw error;
    }
  },

  // PUT /api/buildings/[id]
  updateBuilding: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await buildingService.updateBuilding(id, data);
      const updatedBuilding = response.data.data;
      await get().fetchBuildings();
      set({ isLoading: false });
      return updatedBuilding;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update building',
        isLoading: false,
      });
      throw error;
    }
  },

  // DELETE /api/buildings/[id]
  deleteBuilding: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await buildingService.deleteBuilding(id);
      await get().fetchBuildings();
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete building',
        isLoading: false,
      });
      throw error;
    }
  },

  clearSelected: () => set({ selectedBuilding: null }),
  clearError: () => set({ error: null }),
}));