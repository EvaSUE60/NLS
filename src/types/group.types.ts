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

export interface BulkCreateGroupData {
  count: number;
  max_size?: number;
  name_prefix?: string;
  description?: string;
  start_from?: number;
}

export interface BulkCreateGroupResponse {
  success: boolean;
  message: string;
  data: {
    created: Array<{
      _id: string;
      name: string;
      group_code: string;
      max_size: number;
      created_at: string;
    }>;
    skipped: string[];
    summary: {
      total_requested: number;
      created: number;
      skipped: number;
      total_groups: number;
      total_capacity: number;
      max_size: number;
    };
  };
}

export interface ResetGroupsRequest {
  confirm: boolean;
}

export interface ResetGroupsResponse {
  success: boolean;
  message: string;
  data: {
    before: {
      totalAttendees: number;
      assignedAttendees: number;
      unassignedAttendees: number;
      totalGroups: number;
      groupsWithMembers: number;
      totalMembers: number;
    };
    after: {
      totalAttendees: number;
      assignedAttendees: number;
      unassignedAttendees: number;
      totalGroups: number;
      groupsWithMembers: number;
      totalMembers: number;
    };
    changes: {
      attendees_reset: number;
      groups_cleared: number;
      members_removed: number;
    };
  };
}

export interface BulkResetGroupsRequest {
  confirm: boolean;
  deleteAll?: boolean;
  groupIds?: string[];
}

export interface BulkResetGroupsResponse {
  success: boolean;
  message: string;
  data: {
    deleted_groups: string[];
    deleted_count: number;
    before: {
      totalGroups: number;
      groupsToDelete: number;
      totalAttendees: number;
      assignedAttendees: number;
      totalMembers: number;
    };
    after: {
      totalGroups: number;
      totalAttendees: number;
      assignedAttendees: number;
    };
    changes: {
      groups_deleted: number;
      attendees_reset: number;
      members_removed: number;
    };
  };
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
    total_capacity: number;
    total_points: number;
    total_earned: number;
    total_lost: number;
    average_points: number;
    average_size: number;
    occupancy_rate: number;
    full_groups: number;
    empty_groups: number;
    partial_groups: number;
  };
  region_distribution: Record<string, number>;
  size_distribution: Record<string, number>;
  points_distribution: {
    min: number;
    max: number;
    average: number;
  };
  top_groups: Array<{
    _id: string;
    name: string;
    group_code: string;
    points: number;
    member_count: number;
    max_size: number;
    total_earned: number;
    total_lost: number;
  }>;
  groups: Array<{
    _id: string;
    name: string;
    group_code: string;
    member_count: number;
    max_size: number;
    points: number;
    total_earned: number;
    total_lost: number;
    is_full: boolean;
    is_empty: boolean;
    has_leader: boolean;
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

export interface UpdateGroupData {
  name?: string;
  description?: string;
  max_size?: number;
  leader_id?: string;
  co_leader_id?: string;
  is_active?: boolean;
}