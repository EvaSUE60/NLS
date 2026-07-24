// src/types/attendee.types.ts

export interface Attendee {
  _id: string;
  unique_id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  phone: string;
  email: string;
  gender: 'Male' | 'Female';
  region: string;
  local_church: string;
  campus: string;
  payment_status: 'pending' | 'partial' | 'completed';
  arrived: boolean;
  arrival_time?: string;
  arrival_method?: 'manual' | 'bulk' | 'qr_code';
  dorm_assignment_id?: string | null;
  dorm_cache: {
    roomNumber?: string | null;
    bedNumber?: number | null;
    floor?: string | null;
    buildingType?: string | null;
    buildingName?: string | null;
  };
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
  group_id?: string | null;
  synced_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AttendeeFilters {
  page?: number;
  limit?: number;
  search?: string;
  region?: string;
  gender?: 'Male' | 'Female';
  paymentStatus?: 'pending' | 'partial' | 'completed';
  arrived?: boolean;
}

export interface AttendeeResponse {
  success: boolean;
  data: {
    attendees: Attendee[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    filters: {
      regions: string[];
    };
  };
}

export interface AttendeeStats {
  summary: {
    total_attendees: number;
    arrived: number;
    not_arrived: number;
    arrival_rate: string;
    recent_arrivals: number;
  };
  by_region: Array<{
    _id: string;
    total: number;
    arrived: number;
    not_arrived: number;
  }>;
  recent_check_ins: Array<{
    _id: string;
    unique_id: string;
    first_name: string;
    last_name: string;
    region: string;
    arrival_time: string;
    arrival_method: string;
  }>;
}

export interface CreateAttendeeData {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  gender: 'Male' | 'Female';
  region: string;
  local_church: string;
  campus: string;
  payment_status?: 'pending' | 'partial' | 'completed';
  dorm_cache?: Attendee['dorm_cache'];
  seminars_cache?: Attendee['seminars_cache'];
  group_id?: string;
}

export interface UpdateAttendeeData extends Partial<CreateAttendeeData> {
  arrived?: boolean;
  arrival_time?: string;
  payment_status?: 'pending' | 'partial' | 'completed';
}