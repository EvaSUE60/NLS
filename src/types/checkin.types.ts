// src/types/checkin.types.ts

// ==================== ARRIVAL CHECK-IN ====================

export interface ArrivalCheckInRequest {
  attendeeId: string;
  method?: 'manual' | 'bulk' | 'qr_code';
}

export interface ArrivalCheckInResponse {
  success: boolean;
  message: string;
  data: {
    attendee: {
      _id: string;
      unique_id: string;
      first_name: string;
      last_name: string;
      full_name: string;
      region: string;
      arrived: boolean;
      arrival_time: string;
      arrival_method: string;
      dorm_cache: {
        roomNumber: string | null;
        bedNumber: number | null;
        floor: string | null;
        buildingType: string | null;
        buildingName: string | null;
      };
    };
    checked_by: string;
  };
}

export interface BulkCheckInRequest {
  attendeeIds: string[];
  method?: 'manual' | 'bulk';
}

export interface BulkCheckInResponse {
  success: boolean;
  message: string;
  data: {
    processed: number;
    attendees: Array<{
      _id: string;
      unique_id: string;
      first_name: string;
      last_name: string;
      full_name: string;
    }>;
  };
}

// ==================== SESSION CHECK-IN ====================

export interface SessionCheckInRequest {
  sessionId: string;
  nls_id: string;
  method?: 'manual' | 'qr_code';
}

export interface SessionCheckInResponse {
  success: boolean;
  message: string;
  data: {
    session: {
      _id: string;
      name: string;
      day: number;
      type: string;
    };
    attendee: {
      _id: string;
      unique_id: string;
      full_name: string;
    };
    check_in: {
      method: string;
      time: string;
      status: 'on_time' | 'late' | 'absent';
      checked_by: string;
    };
    attendance_stats: {
      total: number;
      on_time: number;
      late: number;
      absent: number;
    };
    group?: {
      _id: string;
      name: string;
      points: number;
    };
    penalty_applied: boolean;
    penalty_points: number;
  };
}

// ==================== SEMINAR CHECK-IN ====================

export interface SeminarCheckInRequest {
  seminarId: string;
  nls_id: string;
  method?: 'manual' | 'qr_code';
}

export interface SeminarCheckInResponse {
  success: boolean;
  message: string;
  data: {
    seminar: {
      _id: string;
      name: string;
      day: number;
    };
    attendee: {
      _id: string;
      unique_id: string;
      full_name: string;
    };
    check_in: {
      method: string;
      time: string;
      status: 'on_time' | 'late' | 'absent';
      checked_by: string;
    };
    group?: {
      _id: string;
      name: string;
      points: number;
    };
    penalty_applied: boolean;
    penalty_points: number;
  };
}

// ==================== SEARCH ====================

export interface AttendeeSearchResult {
  _id: string;
  unique_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  region: string;
  arrived: boolean;
  arrival_time: string | null;
  badge_printed: boolean;
  dorm_cache: {
    roomNumber: string | null;
    bedNumber: number | null;
    floor: string | null;
    buildingType: string | null;
    buildingName: string | null;
  };
  group_id?: string | null;
}

export interface AttendeeSearchResponse {
  success: boolean;
  data: {
    attendees: AttendeeSearchResult[];
    count: number;
    query: string;
    search_by: string;
  };
}

// ==================== CHECK-IN STATS ====================

export interface CheckInStats {
  summary: {
    total_attendees: number;
    arrived: number;
    not_arrived: number;
    arrival_rate: string;
    recent_arrivals: number;
    badges_printed: number;
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

// ==================== SESSION ATTENDANCE ====================

export interface SessionAttendance {
  session_id: string;
  session_name: string;
  day: number;
  type: string;
  status: 'on_time' | 'late' | 'absent';
  check_in_time: string | null;
}

export interface SessionAttendanceResponse {
  success: boolean;
  data: {
    summary: {
      total_sessions: number;
      on_time: number;
      late: number;
      absent: number;
      attendance_rate: string;
    };
    sessions: SessionAttendance[];
  };
}

// ==================== SEMINAR ATTENDANCE ====================

export interface SeminarAttendance {
  seminar_id: string;
  name: string;
  day: number;
  attended: boolean;
  attended_at: string | null;
  registered_at: string | null;
}

export interface SeminarAttendanceResponse {
  success: boolean;
  data: {
    total_registered: number;
    total_attended: number;
    seminars: SeminarAttendance[];
  };
}