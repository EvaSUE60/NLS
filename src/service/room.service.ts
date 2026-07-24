// src/lib/api/room.service.ts
'use client';

import apiClient from '@/src/lib/api/client';
import {
  Room,
  CreateRoomData,
  UpdateRoomData,
  RoomResponse,
  RoomsListResponse,
} from '@/src/types/room.types';

export const roomService = {
  // ==================== GET ALL ROOMS ====================
  // GET /api/rooms?building_id=xxx&is_full=true&floor=1
  getRooms: (params?: { 
    building_id?: string; 
    is_full?: boolean; 
    floor?: number;
    building_type?: 'men' | 'women';
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.building_id) queryParams.append('building_id', params.building_id);
    if (params?.is_full !== undefined) queryParams.append('is_full', String(params.is_full));
    if (params?.floor) queryParams.append('floor', String(params.floor));
    if (params?.building_type) queryParams.append('building_type', params.building_type);
    
    const queryString = queryParams.toString();
    return apiClient.get<RoomsListResponse>(`/rooms${queryString ? `?${queryString}` : ''}`);
  },

  // ==================== GET SINGLE ROOM ====================
  // GET /api/rooms/[id]
  getRoom: (id: string) =>
    apiClient.get<RoomResponse>(`/rooms/${id}`),

  // ==================== CREATE ROOM ====================
  // POST /api/rooms
  createRoom: (data: CreateRoomData) =>
    apiClient.post<RoomResponse>('/rooms', data),

  // ==================== UPDATE ROOM ====================
  // PUT /api/rooms/[id]
  updateRoom: (id: string, data: UpdateRoomData) =>
    apiClient.put<RoomResponse>(`/rooms/${id}`, data),

  // ==================== DELETE ROOM ====================
  // DELETE /api/rooms/[id]
  deleteRoom: (id: string) =>
    apiClient.delete<{ success: boolean; message: string; data?: { room_id: string; room_number: string } }>(
      `/rooms/${id}`
    ),
};