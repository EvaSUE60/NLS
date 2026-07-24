// src/types/group.types.ts

export interface GroupMember {
  attendeeId: string;
  unique_id: string;
  fullName: string;
  region: string;
  joinedAt: string;
}

export interface GroupActivity {
  activity_id: string;
  type: 'bonus' | 'penalty' | 'auto_penalty';
  description: string;
  points: number;
  reason?: string;
  created_by?: string;
  created_at: string;
}

export interface RegionDistribution {
  region: string;
  count: number;
}

export interface Group {
  _id: string;
  group_id: string;
  name: string;
  group_code: string;
  description?: string;
  members: GroupMember[];
  max_size: number;
  current_size: number;
  points: number;
  total_earned: number;
  total_lost: number;
  activities: GroupActivity[];
  region_distribution: RegionDistribution[];
  leader_id?: string | null;
  co_leader_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  // Extra frontend/stats properties
  member_count?: number;
  available_slots?: number;
  is_full?: boolean;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  max_size?: number;
  leader_id?: string;
  co_leader_id?: string;
}

export interface AutoAssignGroupsRequest {
  groupCount?: number;
  maxSize?: number;
  groupNames?: string[];
}

export interface UpdatePointsRequest {
  type: 'bonus' | 'penalty';
  points: number;
  reason: string;
}

export interface GroupStats {
  summary: {
    total_groups: number;
    total_members: number;
    total_points: number;
    average_points: number;
  };
  region_distribution: Record<string, number>;
  top_groups: Array<{
    name: string;
    group_code: string;
    points: number;
    member_count: number;
  }>;
  groups: Array<{
    _id: string;
    name: string;
    group_code: string;
    member_count: number;
    max_size: number;
    points: number;
    is_full: boolean;
  }>;
}

export interface AutoAssignGroupsResponse {
  success: boolean;
  message: string;
  data: {
    groups: Array<{
      _id: string;
      name: string;
      group_code: string;
      member_count: number;
      max_size: number;
      points: number;
      region_distribution: RegionDistribution[];
    }>;
    results: Array<{
      attendee_id: string;
      unique_id: string;
      full_name: string;
      region: string;
      group?: string;
      group_id?: string;
      status?: string;
    }>;
    summary: {
      total_attendees: number;
      assigned: number;
      unassigned: number;
      groups_created: number;
    };
  };
}

export interface GroupActivitiesResponse {
  success: boolean;
  data: {
    group: {
      _id: string;
      name: string;
      points: number;
      total_earned: number;
      total_lost: number;
    };
    activities: GroupActivity[];
    summary: {
      total_activities: number;
      bonuses: number;
      penalties: number;
    };
  };
}

export interface GroupAssignResponse {
  success: boolean;
  message: string;
  data: {
    group: {
      _id: string;
      name: string;
      group_code: string;
      member_count: number;
      max_size: number;
    };
    attendee: {
      _id: string;
      unique_id: string;
      full_name: string;
    };
  };
}

export interface GroupRemoveResponse {
  success: boolean;
  message: string;
  data: {
    group: {
      _id: string;
      name: string;
      member_count: number;
    };
    attendee: {
      _id: string;
      unique_id: string;
      full_name: string;
    };
  };
}

export interface GroupPointsResponse {
  success: boolean;
  message: string;
  data: {
    group: {
      _id: string;
      name: string;
      points: number;
      total_earned: number;
      total_lost: number;
    };
    activity: {
      type: 'bonus' | 'penalty';
      points: number;
      reason: string;
      created_by: string;
      created_at: string;
    };
    recent_activities: GroupActivity[];
  };
}

export interface GroupsListResponse {
  success: boolean;
  data: Group[];
}

export interface GroupResponse {
  success: boolean;
  data: Group;
}
