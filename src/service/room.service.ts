// src/lib/api/room.service.ts
'use client';

import apiClient from '@/src/lib/api/client';
import {
  Room,
  CreateRoomData,
  UpdateRoomData,
  ToggleRoomStatusData,
  RoomResponse,
  RoomsListResponse,
} from '@/src/types/room.types';

export const roomService = {
  // ==================== GET ALL ROOMS ====================
  getRooms: (params?: { 
    building_id?: string; 
    is_full?: boolean; 
    floor?: number;
    building_type?: 'men' | 'women';
    is_active?: boolean;
    show_inactive?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.building_id) queryParams.append('building_id', params.building_id);
    if (params?.is_full !== undefined) queryParams.append('is_full', String(params.is_full));
    if (params?.floor) queryParams.append('floor', String(params.floor));
    if (params?.building_type) queryParams.append('building_type', params.building_type);
    if (params?.is_active !== undefined) queryParams.append('is_active', String(params.is_active));
    if (params?.show_inactive) queryParams.append('show_inactive', params.show_inactive);
    
    const queryString = queryParams.toString();
    return apiClient.get<RoomsListResponse>(`/rooms${queryString ? `?${queryString}` : ''}`);
  },

  // ==================== GET SINGLE ROOM ====================
  getRoom: (id: string) =>
    apiClient.get<RoomResponse>(`/rooms/${id}`),

  // ==================== CREATE ROOM ====================
  createRoom: (data: CreateRoomData) =>
    apiClient.post<RoomResponse>('/rooms', data),

  // ==================== UPDATE ROOM ====================
  updateRoom: (id: string, data: UpdateRoomData) =>
    apiClient.put<RoomResponse>(`/rooms/${id}`, data),

  // ==================== ✅ TOGGLE ROOM STATUS ====================
  toggleRoomStatus: (id: string, data: ToggleRoomStatusData) =>
    apiClient.patch<RoomResponse>(`/rooms/${id}`, data),

  // ==================== DELETE ROOM ====================
  deleteRoom: (id: string) =>
    apiClient.delete<{ success: boolean; message: string; data?: { room_id: string; room_number: string } }>(
      `/rooms/${id}`
    ),
};