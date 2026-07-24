// src/types/dorm.types.ts

// ==================== DORM STATS ====================
export interface DormStats {
  buildings: {
    total: number;
    men: number;
    women: number;
    details: Array<{
      _id: string;
      building_id: string;
      name: string;
      type: string;
      floors: number;
      total_rooms: number;
      occupied_rooms: number;
      total_beds: number;
      occupied_beds: number;
      total_capacity: number;
    }>;
  };
  rooms: {
    total: number;
    available: number;
    occupied: number;
    empty: number;
    partial: number;
    full: number;
    occupancy_rate: number;
    by_type: Array<{
      _id: string | null;
      total_beds: number;
      occupied_beds: number;
      rooms_count: number;
    }>;
  };
  beds: {
    total: number;
    occupied: number;
    available: number;
    occupancy_rate: number;
  };
  assignments: {
    active: number;
    cancelled: number;
    changed: number;
    total: number;
    by_building: Array<{
      _id: string;
      building_name: string;
      building_type: string;
      count: number;
    }>;
    recent: {
      today: number;
      week: number;
    };
  };
  attendees: {
    total: number;
    assigned: number;
    unassigned: number;
    assignment_rate: number;
    by_gender: Array<{
      _id: string;
      total: number;
      assigned: number;
      unassigned: number;
    }>;
    by_region: Array<{
      _id: string;
      count: number;
      assigned: number;
    }>;
  };
  occupancy_distribution: Array<{
    _id: number;
    count: number;
  }>;
}

// ==================== DORM ASSIGNMENT ====================
export interface DormAssignment {
  _id: string;
  assignment_id: string;
  attendee_id: {
    _id: string;
    unique_id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
  };
  room_id: {
    _id: string;
    room_number: string;
    floor: string;
    floor_name?: string;
    capacity: number;
    current_occupancy?: number;
  };
  building_id: {
    _id: string;
    building_id: string;
    name: string;
    type: 'men' | 'women';
  };
  bed_number: number;
  assigned_by: {
    _id: string;
    name: string;
    email: string;
  };
  assigned_at: string;
  status: 'active' | 'cancelled' | 'changed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ==================== AUTO-ASSIGN ====================
export interface AutoAssignResult {
  attendee_id: string;
  unique_id: string;
  full_name: string;
  region: string;
  room_number: string;
  bed_number: number;
  building_type: 'men' | 'women';
  assignment_id: string;
}

export interface AutoAssignResponse {
  success: boolean;
  message: string;
  data: {
    summary: {
      total_attendees: number;
      total_assigned: number;
      total_unassigned: number;
      male_assigned: number;
      female_assigned: number;
      overall_assigned: number;
      overall_unassigned: number;
      overall_total: number;
    };
    rooms: {
      men: {
        building_name: string;
        assignments: AutoAssignResult[];
        unassigned: Array<{
          unique_id: string;
          full_name: string;
          region: string;
        }>;
      };
      women: {
        building_name: string;
        assignments: AutoAssignResult[];
        unassigned: Array<{
          unique_id: string;
          full_name: string;
          region: string;
        }>;
      };
    };
    room_details: Array<{
      room_number: string;
      building_type: string;
      occupants: Array<{
        unique_id: string;
        full_name: string;
        region: string;
        bed_number: number;
      }>;
    }>;
    unassigned: Array<{
      unique_id: string;
      full_name: string;
      region: string;
    }>;
  };
}

// ==================== RESET DORM ====================
export interface ResetDormResponse {
  success: boolean;
  message: string;
  data: {
    before: {
      assignments: number;
      assignedAttendees: number;
      occupiedRooms: number;
      occupiedBeds: number;
    };
    after: {
      assignments: number;
      assignedAttendees: number;
      occupiedRooms: number;
      occupiedBeds: number;
    };
    changes: {
      assignments_deleted: number;
      attendees_reset: number;
      rooms_reset: number;
      buildings_reset: number;
    };
  };
}

// ==================== DORM ASSIGNMENT LIST ====================
export interface DormAssignmentListResponse {
  success: boolean;
  data: DormAssignment[];
}

export interface DormStatsResponse {
  success: boolean;
  data: DormStats;
}

// ==================== ASSIGNMENT FILTERS ====================
export interface AssignmentFilters {
  status?: 'active' | 'cancelled' | 'changed';
  building_id?: string;
  room_id?: string;
}