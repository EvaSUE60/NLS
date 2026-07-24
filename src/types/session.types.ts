// src/types/session.types.ts

export interface SessionAttendee {
  attendeeId: string;
  unique_id: string;
  fullName: string;
  region: string;
  check_in_time?: string;
  check_in_method?: 'qr_code' | 'manual';
  status: 'on_time' | 'late' | 'absent';
  checkedInBy?: string;
}

export interface SessionAttendanceStats {
  total: number;
  on_time: number;
  late: number;
  absent: number;
}

export interface Session {
  _id: string;
  session_id: string;
  name: string;
  type: 'morning' | 'afternoon';
  day: number;
  date: string;
  start_time: string;
  end_time: string;
  on_time_start: string;
  on_time_end: string;
  late_end: string;
  room?: string;
  building?: string;
  attendees: SessionAttendee[];
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Virtuals
  dayLabel?: string;
  location?: string;
  attendanceStats?: SessionAttendanceStats;
}

export interface CreateSessionData {
  name: string;
  type: 'morning' | 'afternoon';
  day: number;
  date: string;
  start_time: string;
  end_time: string;
  on_time_start: string;
  on_time_end: string;
  late_end: string;
  room?: string;
  building?: string;
}

export interface UpdateSessionData extends Partial<CreateSessionData> {
  is_active?: boolean;
}

export interface GenerateSessionsData {
  days?: number[];
  date?: string;
  morning_time?: string;
  morning_end?: string;
  afternoon_time?: string;
  afternoon_end?: string;
  on_time_window?: number;
  late_window?: number;
  room_prefix?: string;
  building?: string;
}

export interface SessionFilters {
  day?: number;
  type?: 'morning' | 'afternoon';
}

export interface SessionCheckInRequest {
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
    attendance_stats: SessionAttendanceStats;
    group?: {
      _id: string;
      name: string;
      points: number;
    } | null;
    penalty_applied: boolean;
    penalty_points: number;
  };
}

export interface SessionsListResponse {
  success: boolean;
  data: Session[];
}

export interface SessionResponse {
  success: boolean;
  data: Session;
}
