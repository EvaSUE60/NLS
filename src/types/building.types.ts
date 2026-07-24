// src/types/building.types.ts

export interface Building {
  _id: string;
  building_id: string;
  name: string;
  type: 'men' | 'women';
  floors: number;
  total_rooms: number;
  occupied_rooms: number;
  capacity: number;
  current_occupancy: number;
  address?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Virtuals from API
  room_count?: number;
  available_rooms?: number;
  available_beds?: number;
  occupancy_rate?: number;
}

export interface CreateBuildingData {
  name: string;
  type: 'men' | 'women';
  total_floors: number;
  rooms_per_floor: number;
  default_capacity: number;
  address?: string;
  description?: string;
}

export interface UpdateBuildingData extends Partial<CreateBuildingData> {
  is_active?: boolean;
}

export interface BuildingResponse {
  success: boolean;
  data: Building;
}

export interface BuildingsListResponse {
  success: boolean;
  data: Building[];
}