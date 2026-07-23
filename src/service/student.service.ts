// src/lib/api/student.service.ts
import apiClient from '@/src/lib/api/client';

export interface StudentProfile {
  unique_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  gender: string;
  region: string;
  local_church: string;
  campus: string;
  payment_status: string;
  arrived: boolean;
  arrival_time: string | null;
  arrival_method: string | null;
}

export interface StudentRoom {
  room_number: string;
  bed_number: number;
  floor: string;
  building_name: string;
  building_type: string;
}

export interface StudentGroup {
  group_id: string;
  name: string;
  group_code: string;
  points: number;
  total_earned: number;
  total_lost: number;
  member_count: number;
  max_size: number;
  joined_at: string | null;
  is_full: boolean;
}

export interface StudentSeminar {
  seminar_id: string;
  name: string;
  category: string;
  day: number;
  date: string;
  start_time: string;
  end_time: string;
  room: string;
  building: string;
  attended: boolean;
  attended_at: string | null;
  registered_at: string | null;
}

export interface StudentSession {
  session_id: string;
  name: string;
  day: number;
  type: string;
  date: string;
  start_time: string;
  end_time: string;
  room: string;
  building: string;
  status: 'on_time' | 'late' | 'absent';
  check_in_time: string | null;
}

export interface StudentInfoResponse {
  student: StudentProfile;
  room: StudentRoom | null;
  group: StudentGroup | null;
  seminars: {
    total_registered: number;
    total_attended: number;
    seminars: StudentSeminar[];
  };
  sessions: {
    total_sessions: number;
    on_time: number;
    late: number;
    absent: number;
    attendance_rate: string;
    sessions: StudentSession[];
  };
  arrival: {
    arrived: boolean;
    arrival_time: string | null;
    arrival_method: string | null;
  };
  summary: {
    has_room: boolean;
    has_group: boolean;
    total_seminars: number;
    total_sessions: number;
    attendance_rate: string;
  };
  cache: {
    seminars: { registered: string[]; attended: string[] };
    sessions: { attended: string[]; on_time: string[]; late: string[]; absent: string[] };
  };
}

export const studentService = {
  // Get complete student info by NLS ID
  getStudentInfo: (nlsId: string) =>
    apiClient.get<{ success: boolean; data: StudentInfoResponse }>(
      `/students/${nlsId}/info`
    ),
};