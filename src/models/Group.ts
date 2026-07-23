// src/models/Group.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IGroupMember {
  attendeeId: mongoose.Types.ObjectId;
  unique_id: string;
  fullName: string;
  region: string;
  joinedAt: Date;
}

export interface IGroupActivity {
  activity_id: string;
  type: "bonus" | "penalty" | "auto_penalty";
  description: string;
  points: number;
  reason?: string;
  created_by?: mongoose.Types.ObjectId;
  created_at: Date;
}

export interface IGroup extends Document {
  group_id: string;
  name: string;
  group_code: string;
  description?: string;
  
  // Members
  members: IGroupMember[];
  max_size: number;
  current_size: number;
  
  // Points System
  points: number;
  total_earned: number;
  total_lost: number;
  activities: IGroupActivity[];
  
  // Region Mix
  region_distribution: {
    region: string;
    count: number;
  }[];
  
  // Leadership
  leader_id?: mongoose.Types.ObjectId;
  co_leader_id?: mongoose.Types.ObjectId;
  
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  
  // Virtuals
  member_count?: number;
  average_points?: number;
}

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
    enum: ["bonus", "penalty", "auto_penalty"],
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
  created_by: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const GroupSchema = new Schema<IGroup>(
  {
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
    region_distribution: {
      type: [{
        region: { type: String, trim: true },
        count: { type: Number, default: 0 },
      }],
      default: [],
    },
    leader_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    co_leader_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
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

// Indexes
GroupSchema.index({ group_id: 1 }, { unique: true });
GroupSchema.index({ name: 1 }, { unique: true });
GroupSchema.index({ group_code: 1 }, { unique: true });
GroupSchema.index({ is_active: 1 });

// Virtuals
GroupSchema.virtual("member_count").get(function() {
  return this.members.length;
});

GroupSchema.virtual("average_points").get(function() {
  return this.members.length > 0 ? this.points / this.members.length : 0;
});

// JSON Transform
GroupSchema.set("toJSON", {
  virtuals: true,
  transform: function(_doc, ret) {
    const { __v, ...rest } = ret;
    return rest;
  },
});

const Group = mongoose.models.Group || 
  mongoose.model<IGroup>("Group", GroupSchema);

export default Group;