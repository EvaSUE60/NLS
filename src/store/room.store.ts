// src/lib/stores/room.store.ts
'use client';

import { create } from 'zustand';
import { Room, CreateRoomData, UpdateRoomData } from '@/src/types/room.types';
import { roomService } from '@/src/service/room.service';

interface RoomState {
  // ==================== STATE ====================
  rooms: Room[];
  selectedRoom: Room | null;
  isLoading: boolean;
  error: string | null;
  
  // Filters
  filters: {
    building_id?: string;
    is_full?: boolean;
    floor?: number;
    building_type?: 'men' | 'women';
  };
  
  // Stats
  stats: {
    total: number;
    available: number;
    occupied: number;
    by_building_type: {
      men: { total: number; occupied: number };
      women: { total: number; occupied: number };
    };
  } | null;

  // ==================== ACTIONS ====================
  fetchRooms: (params?: { building_id?: string; is_full?: boolean; floor?: number; building_type?: 'men' | 'women' }) => Promise<void>;
  fetchRoom: (id: string) => Promise<void>;
  createRoom: (data: CreateRoomData) => Promise<Room>;
  updateRoom: (id: string, data: UpdateRoomData) => Promise<Room>;
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
};

export const useRoomStore = create<RoomState>((set, get) => ({
  // ==================== INITIAL STATE ====================
  rooms: [],
  selectedRoom: null,
  isLoading: false,
  error: null,
  filters: initialFilters,
  stats: null,

  // ==================== FETCH ROOMS ====================
  // GET /api/rooms
  fetchRooms: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const newFilters = { ...get().filters, ...params };
      set({ filters: newFilters });

      const response = await roomService.getRooms(newFilters);
      const rooms = response.data.data;

      // Calculate stats
      const total = rooms.length;
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
          by_building_type: {
            men: {
              total: menRooms.length,
              occupied: menRooms.filter((r) => r.is_full || r.current_occupancy > 0).length,
            },
            women: {
              total: womenRooms.length,
              occupied: womenRooms.filter((r) => r.is_full || r.current_occupancy > 0).length,
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
  // GET /api/rooms/[id]
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
  // POST /api/rooms
  createRoom: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await roomService.createRoom(data);
      const newRoom = response.data.data;
      
      // Refresh the list
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
  // PUT /api/rooms/[id]
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

  // ==================== DELETE ROOM ====================
  // DELETE /api/rooms/[id]
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