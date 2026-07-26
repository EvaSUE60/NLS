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
  code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  __v?: number;
  
  // Virtuals from API
  room_count?: number;
  available_rooms?: number;
  total_occupants?: number;
  total_beds?: number;
  available_beds?: number;
  occupancy_rate?: number;
}

export interface RoomOccupant {
  _id: string;
  unique_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  dorm_cache: {
    roomNumber: string | null;
    bedNumber: number | null;
    floor: string | null;
    buildingType: string | null;
    buildingName: string | null;
  };
  has_room: boolean;
  seminars_cache: {
    registered: string[];
    attended: string[];
  };
  sessions_cache: {
    attended: string[];
    on_time: string[];
    late: string[];
    absent: string[];
  };
}

export interface Room {
  _id: string;
  room_id: string;
  building_id: string;
  room_number: string;
  floor: number;
  floor_name: string;
  capacity: number;
  occupants: RoomOccupant[];
  current_occupancy: number;
  is_full: boolean;
  bed_numbers: number[];
  check_in_status: 'empty' | 'partial' | 'full';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  available_slots?: number;
  occupant_count?: number;
}

export interface BuildingStats {
  total_rooms: number;
  total_beds: number;
  occupied_beds: number;
  available_beds: number;
  occupancy_rate: string;
}

export interface BuildingDetailsResponse {
  success: boolean;
  data: {
    building: Building;
    stats: BuildingStats;
    rooms?: Room[];
  };
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