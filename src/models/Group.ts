// src/models/Group.ts
import mongoose, { Schema, Document } from "mongoose";

// ==================== INTERFACES ====================

export interface IGroupMember {
  attendeeId: mongoose.Types.ObjectId;
  unique_id: string;
  fullName: string;
  region: string;
  joinedAt: Date;
}

export interface IGroupActivity {
  activity_id: string;
  type: "bonus" | "penalty" | "auto_penalty" | "seminar_bonus" | "seminar_penalty" | "session_bonus" | "session_penalty";
  description: string;
  points: number;
  reason?: string;
  source_type?: "session" | "seminar" | "manual";
  source_id?: string;
  source_name?: string;
  created_by?: mongoose.Types.ObjectId;
  created_at: Date;
}

export interface IGroupSeminarStats {
  total_registered: number;
  total_attended: number;
  on_time: number;
  late: number;
  absent: number;
  total_points_earned: number;
  total_points_lost: number;
}

export interface IGroupSessionStats {
  total_sessions: number;
  on_time: number;
  late: number;
  absent: number;
  total_points_lost: number;
}

export interface IGroup extends Document {
  // ==================== IDENTIFICATION ====================
  group_id: string;
  name: string;
  group_code: string;
  description?: string;
  
  // ==================== MEMBERS ====================
  members: IGroupMember[];
  max_size: number;
  current_size: number;
  
  // ==================== POINTS SYSTEM ====================
  points: number;
  total_earned: number;
  total_lost: number;
  activities: IGroupActivity[];
  
  // ==================== STATS ====================
  seminar_stats: IGroupSeminarStats;
  session_stats: IGroupSessionStats;
  
  // ==================== REGION DISTRIBUTION ====================
  region_distribution: {
    region: string;
    count: number;
  }[];
  
  // ==================== LEADERSHIP ====================
  leader_id?: mongoose.Types.ObjectId;
  co_leader_id?: mongoose.Types.ObjectId;
  
  // ==================== STATUS ====================
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  
  // ==================== VIRTUALS ====================
  member_count?: number;
  average_points?: number;
}

// ==================== SCHEMAS ====================

const GroupMemberSchema = new Schema<IGroupMember>({
  attendeeId: {
    type: Schema.Types.ObjectId,
    ref: "Attendee",
    required: true,
  },
  unique_id: {
    type: String,
    required: true,
    trim: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  region: {
    type: String,
    required: true,
    trim: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const GroupActivitySchema = new Schema<IGroupActivity>({
  activity_id: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: [
      "bonus", 
      "penalty", 
      "auto_penalty",
      "seminar_bonus",
      "seminar_penalty",
      "session_bonus",
      "session_penalty"
    ],
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  points: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    trim: true,
  },
  source_type: {
    type: String,
    enum: ["session", "seminar", "manual"],
  },
  source_id: {
    type: String,
    trim: true,
  },
  source_name: {
    type: String,
    trim: true,
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const GroupSeminarStatsSchema = new Schema<IGroupSeminarStats>({
  total_registered: { type: Number, default: 0 },
  total_attended: { type: Number, default: 0 },
  on_time: { type: Number, default: 0 },
  late: { type: Number, default: 0 },
  absent: { type: Number, default: 0 },
  total_points_earned: { type: Number, default: 0 },
  total_points_lost: { type: Number, default: 0 },
});

const GroupSessionStatsSchema = new Schema<IGroupSessionStats>({
  total_sessions: { type: Number, default: 0 },
  on_time: { type: Number, default: 0 },
  late: { type: Number, default: 0 },
  absent: { type: Number, default: 0 },
  total_points_lost: { type: Number, default: 0 },
});

// ==================== MAIN SCHEMA ====================

const GroupSchema = new Schema<IGroup>(
  {
    // Identification
    group_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    group_code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    
    // Members
    members: {
      type: [GroupMemberSchema],
      default: [],
    },
    max_size: {
      type: Number,
      required: true,
      default: 12,
      min: 1,
      max: 20,
    },
    current_size: {
      type: Number,
      default: 0,
    },
    
    // Points System
    points: {
      type: Number,
      default: 40,
    },
    total_earned: {
      type: Number,
      default: 0,
    },
    total_lost: {
      type: Number,
      default: 0,
    },
    activities: {
      type: [GroupActivitySchema],
      default: [],
    },
    
    // Stats
    seminar_stats: {
      type: GroupSeminarStatsSchema,
      default: () => ({
        total_registered: 0,
        total_attended: 0,
        on_time: 0,
        late: 0,
        absent: 0,
        total_points_earned: 0,
        total_points_lost: 0,
      }),
    },
    session_stats: {
      type: GroupSessionStatsSchema,
      default: () => ({
        total_sessions: 0,
        on_time: 0,
        late: 0,
        absent: 0,
        total_points_lost: 0,
      }),
    },
    
    // Region Distribution
    region_distribution: {
      type: [{
        region: { type: String, trim: true },
        count: { type: Number, default: 0 },
      }],
      default: [],
    },
    
    // Leadership
    leader_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    co_leader_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    
    // Status
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// ==================== INDEXES ====================

GroupSchema.index({ group_id: 1 }, { unique: true });
GroupSchema.index({ name: 1 }, { unique: true });
GroupSchema.index({ group_code: 1 }, { unique: true });
GroupSchema.index({ is_active: 1 });

// ==================== VIRTUALS ====================

GroupSchema.virtual("member_count").get(function() {
  return this.members.length;
});

GroupSchema.virtual("average_points").get(function() {
  return this.members.length > 0 ? this.points / this.members.length : 0;
});

// ==================== METHODS ====================

GroupSchema.methods.addActivity = async function(
  type: IGroupActivity['type'],
  description: string,
  points: number,
  options?: {
    reason?: string;
    source_type?: "session" | "seminar" | "manual";
    source_id?: string;
    source_name?: string;
    created_by?: mongoose.Types.ObjectId;
  }
) {
  const activity: IGroupActivity = {
    activity_id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type,
    description,
    points,
    reason: options?.reason,
    source_type: options?.source_type,
    source_id: options?.source_id,
    source_name: options?.source_name,
    created_by: options?.created_by,
    created_at: new Date(),
  };
  
  this.activities.push(activity);
  this.points += points;
  
  if (points > 0) {
    this.total_earned += points;
  } else {
    this.total_lost += Math.abs(points);
  }
  
  return this.save();
};

// ==================== STATIC METHODS ====================

GroupSchema.statics.getGroupStats = async function(groupId: string) {
  const group = await this.findById(groupId);
  if (!group) return null;
  
  return {
    points: group.points,
    total_earned: group.total_earned,
    total_lost: group.total_lost,
    member_count: group.members.length,
    average_points: group.members.length > 0 ? group.points / group.members.length : 0,
    seminar_stats: group.seminar_stats,
    session_stats: group.session_stats,
    activities: group.activities.slice(-10), // Last 10 activities
  };
};

// ==================== TO JSON / TO OBJECT ====================

GroupSchema.set("toJSON", {
  virtuals: true,
  transform: function(_doc, ret) {
    const { __v, ...rest } = ret;
    return rest;
  },
});

GroupSchema.set("toObject", {
  virtuals: true,
});

// ==================== MODEL ====================

const Group = mongoose.models.Group || 
  mongoose.model<IGroup>("Group", GroupSchema);

export default Group;