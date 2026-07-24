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

export interface BuildingDetailsResponse {
  success: boolean;
  data: {
    building: Building;
    stats: {
      total_rooms: number;
      total_beds: number;
      occupied_beds: number;
      available_beds: number;
      occupancy_rate: number | string;
    };
    rooms_by_floor: Array<{
      floor: number;
      floor_name: string;
      rooms: any[];
    }>;
    all_rooms: any[];
  };
}

export interface CreateBuildingResponse {
  success: boolean;
  message: string;
  data: {
    building: Building;
    total_rooms: number;
    inserted_rooms: number;
    total_capacity: number;
  };
}

export interface BuildingResponse {
  success: boolean;
  data: Building;
}

export interface BuildingsListResponse {
  success: boolean;
  data: Building[];
}