// src/types/room.types.ts

export interface Room {
  _id: string;
  room_id: string;
  building_id: string;
  room_number: string;
  floor: number;
  floor_name: string;
  capacity: number;
  current_occupancy: number;
  occupants: string[];
  is_full: boolean;
  bed_numbers: number[];
  check_in_status: 'empty' | 'partial' | 'full';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Virtuals
  available_slots?: number;
  occupant_count?: number;
  
  // Populated fields
  building_name?: string;
  building_type?: 'men' | 'women';
}

export interface CreateRoomData {
  building_id: string;
  room_number: string;
  floor: number;
  capacity: number;
}

export interface UpdateRoomData extends Partial<CreateRoomData> {
  is_active?: boolean;
  is_full?: boolean;
}

// API Responses
export interface RoomResponse {
  success: boolean;
  data: Room;
}

export interface RoomsListResponse {
  success: boolean;
  data: {
    rooms: Room[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    stats?: Array<{
      _id: string;
      total_rooms: number;
      occupied_rooms: number;
      total_beds: number;
      occupied_beds: number;
    }>;
  };
}

export interface RoomWithBuilding extends Room {
  building_name: string;
  building_type: 'men' | 'women';
}