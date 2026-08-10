// src/types/seminar.types.ts

export interface Participant {
  attendeeId: string;
  unique_id: string;
  fullName: string;
  region: string;
  registeredAt: string;
  attended: boolean;
  attendedAt?: string;
  check_in_method?: 'qr_code' | 'manual';
  checkedInBy?: string;
  status?: 'on_time' | 'late' | 'absent';
  points_awarded?: number;
}

export interface Evaluation {
  rating: number;
  comment: string;
  submittedBy: string;
  submittedAt: string;
  attendeeId?: string;
}

export interface Seminar {
  _id: string;
  seminar_id: string;
  seminar_key: string;
  name: string;
  category?: string;
  description?: string;
  day: number;
  date: string;
  start_time: string;
  end_time: string;
  // ✅ Added timing fields
  on_time_start?: string;
  on_time_end?: string;
  late_end?: string;
  room?: string;
  building?: string;
  capacity: number;
  participants: Participant[];
  evaluations: Evaluation[];
  attendance_stats?: {
    total: number;
    on_time: number;
    late: number;
    absent: number;
  };
  isClosed: boolean;
  is_active: boolean;
  createdBy: string;
  created_at: string;
  updated_at: string;
  
  // Virtuals
  registeredCount?: number;
  remainingSlots?: number;
  isFull?: boolean;
  dayLabel?: string;
  location?: string;
  averageRating?: number | null;
  
  // ✅ Computed stats
  participation_breakdown?: {
    on_time: number;
    late: number;
    absent: number;
    total: number;
  };
  points_summary?: {
    on_time_bonus: number;
    late_penalty: number;
    absent_penalty: number;
    total: number;
  };
}

export interface CreateSeminarData {
  seminar_key: string;
  name: string;
  category?: string;
  description?: string;
  day: number;
  date: string;
  start_time: string;
  end_time: string;
  // ✅ Added timing fields
  on_time_start?: string;
  on_time_end?: string;
  late_end?: string;
  room?: string;
  building?: string;
  capacity?: number;
}

export interface UpdateSeminarData extends Partial<CreateSeminarData> {
  isClosed?: boolean;
  is_active?: boolean;
}

export interface GenerateSeminarsData {
  days?: number[];
  date: string;
  start_time?: string;
  end_time?: string;
  // ✅ Added timing fields for generation
  on_time_start?: string;
  on_time_end?: string;
  late_end?: string;
  room_prefix?: string;
  building?: string;
  capacity?: number;
}

export interface SeminarFilters {
  day?: number;
  seminar_key?: string;
  isActive?: boolean;
  date?: string;
}

export interface SeminarStats {
  summary: {
    total_seminars: number;
    total_registrations: number;
    total_attendance: number;
    attendance_rate: number | string;
  };
  by_day: Array<{
    _id: number;
    total_seminars: number;
    total_registered: number;
    total_attended: number;
  }>;
  top_seminars: Array<{
    _id: string;
    name: string;
    seminar_key: string;
    day: number;
    registered_count: number;
    attended_count: number;
  }>;
}

export interface SeminarParticipantsResponse {
  success: boolean;
  data: {
    seminar: {
      _id: string;
      name: string;
      day: number;
    };
    stats: {
      total_registered: number;
      attended: number;
      not_attended: number;
      capacity: number;
      remaining_slots: number;
    };
    participants: Participant[];
  };
}

export interface SeminarRegisterResponse {
  success: boolean;
  message: string;
  data: {
    seminar: {
      _id: string;
      seminar_id: string;
      name: string;
      day: number;
      start_time: string;
      end_time: string;
      room?: string;
      building?: string;
    };
    attendee: {
      _id: string;
      unique_id: string;
      full_name: string;
      region: string;
    };
    registered_count: number;
    remaining_slots: number;
  };
}

export interface SeminarAttendanceCheckInResponse {
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
      time_string_local?: string;
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
    } | null;
    points_awarded: number;
    points_reason: string;
  };
}

export interface SeminarResponse {
  success: boolean;
  data: Seminar;
}

export interface SeminarsListResponse {
  success: boolean;
  data: Seminar[];
}

export interface GenerateSeminarsResponse {
  success: boolean;
  message: string;
  data: {
    created: number;
    skipped: number;
    errors?: Array<{
      seminar: string;
      day: number;
      error: string;
    }>;
    total_seminars: number;
    days_processed: number;
    seminars_per_day: number;
    created_seminars: Array<{
      name: string;
      day: number;
      seminar_id: string;
      on_time_start?: string;
      on_time_end?: string;
      late_end?: string;
    }>;
    timing_config: {
      start_time: string;
      end_time: string;
      on_time_start: string;
      on_time_end: string;
      late_end: string;
    };
  };
}