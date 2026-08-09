// src/lib/stores/room.store.ts
'use client';

import { create } from 'zustand';
import { Room, CreateRoomData, UpdateRoomData, ToggleRoomStatusData } from '@/src/types/room.types';
import { roomService } from '@/src/service/room.service';

interface RoomState {
  // ==================== STATE ====================
  rooms: Room[];
  selectedRoom: Room | null;
  isLoading: boolean;
  error: string | null;
  isToggling: boolean;
  
  // Filters
  filters: {
    building_id?: string;
    is_full?: boolean;
    floor?: number;
    building_type?: 'men' | 'women';
    is_active?: boolean;
    show_inactive?: string; // ✅ Changed to string
  };
  
  // Stats
  stats: {
    total: number;
    available: number;
    occupied: number;
    inactive: number;
    by_building_type: {
      men: { total: number; occupied: number; inactive: number };
      women: { total: number; occupied: number; inactive: number };
    };
  } | null;

  // ==================== ACTIONS ====================
  fetchRooms: (params?: { 
    building_id?: string; 
    is_full?: boolean; 
    floor?: number; 
    building_type?: 'men' | 'women';
    is_active?: boolean;
    show_inactive?: string; // ✅ Changed to string
  }) => Promise<void>;
  fetchRoom: (id: string) => Promise<void>;
  createRoom: (data: CreateRoomData) => Promise<Room>;
  updateRoom: (id: string, data: UpdateRoomData) => Promise<Room>;
  toggleRoomStatus: (id: string, isActive: boolean) => Promise<Room>;
  deleteRoom: (id: string) => Promise<void>;
  clearSelected: () => void;
  clearError: () => void;
  resetFilters: () => void;
}

const initialFilters = {
  building_id: undefined,
  is_full: undefined,
  floor: undefined,
  building_type: undefined,
  is_active: undefined,
  show_inactive: undefined, // ✅ Changed to string
};

export const useRoomStore = create<RoomState>((set, get) => ({
  // ==================== INITIAL STATE ====================
  rooms: [],
  selectedRoom: null,
  isLoading: false,
  error: null,
  isToggling: false,
  filters: initialFilters,
  stats: null,

  // ==================== FETCH ROOMS ====================
  fetchRooms: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const newFilters = { ...get().filters, ...params };
      set({ filters: newFilters });

      const response = await roomService.getRooms(newFilters);
      const rooms = response.data.data.rooms || [];

      // Calculate stats including inactive rooms
      const total = rooms.length;
      const activeRooms = rooms.filter((r) => r.is_active);
      const inactiveRooms = rooms.filter((r) => !r.is_active);
      const available = rooms.filter((r) => !r.is_full && r.is_active).length;
      const occupied = rooms.filter((r) => r.is_full || r.current_occupancy > 0).length;
      
      const menRooms = rooms.filter((r) => r.building_type === 'men');
      const womenRooms = rooms.filter((r) => r.building_type === 'women');

      set({
        rooms,
        stats: {
          total,
          available,
          occupied,
          inactive: inactiveRooms.length,
          by_building_type: {
            men: {
              total: menRooms.length,
              occupied: menRooms.filter((r) => r.is_full || r.current_occupancy > 0).length,
              inactive: menRooms.filter((r) => !r.is_active).length,
            },
            women: {
              total: womenRooms.length,
              occupied: womenRooms.filter((r) => r.is_full || r.current_occupancy > 0).length,
              inactive: womenRooms.filter((r) => !r.is_active).length,
            },
          },
        },
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch rooms',
        isLoading: false,
      });
    }
  },

  // ==================== FETCH SINGLE ROOM ====================
  fetchRoom: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await roomService.getRoom(id);
      set({
        selectedRoom: response.data.data,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to fetch room',
        isLoading: false,
      });
    }
  },

  // ==================== CREATE ROOM ====================
  createRoom: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await roomService.createRoom(data);
      const newRoom = response.data.data;
      
      await get().fetchRooms();
      
      set({ isLoading: false });
      return newRoom;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to create room',
        isLoading: false,
      });
      throw error;
    }
  },

  // ==================== UPDATE ROOM ====================
  updateRoom: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await roomService.updateRoom(id, data);
      const updatedRoom = response.data.data;
      
      set((state) => ({
        rooms: state.rooms.map((r) => (r._id === id ? updatedRoom : r)),
        selectedRoom: state.selectedRoom?._id === id ? updatedRoom : state.selectedRoom,
        isLoading: false,
      }));
      
      return updatedRoom;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to update room',
        isLoading: false,
      });
      throw error;
    }
  },

  // ==================== TOGGLE ROOM STATUS ====================
  toggleRoomStatus: async (id, isActive) => {
    set({ isToggling: true, error: null });
    try {
      const response = await roomService.toggleRoomStatus(id, { is_active: isActive });
      const updatedRoom = response.data.data;
      
      set((state) => ({
        rooms: state.rooms.map((r) => (r._id === id ? updatedRoom : r)),
        selectedRoom: state.selectedRoom?._id === id ? updatedRoom : state.selectedRoom,
        isToggling: false,
      }));
      
      // Refresh stats after toggling
      await get().fetchRooms(get().filters);
      
      return updatedRoom;
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to toggle room status',
        isToggling: false,
      });
      throw error;
    }
  },

  // ==================== DELETE ROOM ====================
  deleteRoom: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await roomService.deleteRoom(id);
      
      set((state) => ({
        rooms: state.rooms.filter((r) => r._id !== id),
        selectedRoom: state.selectedRoom?._id === id ? null : state.selectedRoom,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Failed to delete room',
        isLoading: false,
      });
      throw error;
    }
  },

  // ==================== CLEAR SELECTED ====================
  clearSelected: () => {
    set({ selectedRoom: null });
  },

  // ==================== CLEAR ERROR ====================
  clearError: () => {
    set({ error: null });
  },

  // ==================== RESET FILTERS ====================
  resetFilters: () => {
    set({ filters: initialFilters });
    get().fetchRooms(initialFilters);
  },
}));