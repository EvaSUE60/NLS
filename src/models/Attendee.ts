// src/models/Attendee.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IAttendee extends Document {
  unique_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  gender: "Male" | "Female";
  region: string;
  local_church: string;
  campus: string;
  payment_status: "pending" | "partial" | "completed";
  checked_in: boolean;
  checked_in_at?: Date;
  checked_in_by?: mongoose.Types.ObjectId;
  dorm_cache: {
    roomNumber?: string | null;
    bedNumber?: number | null;
    floor?: string | null;
    buildingType?: "men" | "women" | null;
  };
  seminars_cache: {
    registered?: string[];
    attended?: string[];
  };
  group_id?: mongoose.Types.ObjectId | null;
  synced_at?: Date;
  created_at: Date;
  updated_at: Date;
  
  // Virtuals
  full_name?: string;
  has_room?: boolean;
}

const AttendeeSchema = new Schema<IAttendee>(
  {
    unique_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    first_name: {
      type: String,
      required: true,
      trim: true,
    },
    last_name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },
    region: {
      type: String,
      required: true,
      trim: true,
    },
    local_church: {
      type: String,
      required: true,
      trim: true,
    },
    campus: {
      type: String,
      required: true,
      trim: true,
    },
    payment_status: {
      type: String,
      enum: ["pending", "partial", "completed"],
      default: "pending",
    },
    checked_in: {
      type: Boolean,
      default: false,
    },
    checked_in_at: {
      type: Date,
    },
    checked_in_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    dorm_cache: {
      roomNumber: { type: String, trim: true, default: null },
      bedNumber: { type: Number, min: 1, max: 4, default: null },
      floor: { type: String, trim: true, default: null },
      buildingType: { type: String, enum: ["men", "women"], default: null },
    },
    seminars_cache: {
      registered: [{ type: String, trim: true }],
      attended: [{ type: String, trim: true }],
    },
    group_id: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    synced_at: {
      type: Date,
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
AttendeeSchema.index({ unique_id: 1 }, { unique: true });
AttendeeSchema.index({ email: 1 });
AttendeeSchema.index({ phone: 1 });
AttendeeSchema.index({ region: 1 });
AttendeeSchema.index({ gender: 1 });
AttendeeSchema.index({ checked_in: 1 });
AttendeeSchema.index({ group_id: 1 });
AttendeeSchema.index({ payment_status: 1 });
AttendeeSchema.index({ "dorm_cache.roomNumber": 1 });

// Virtuals
AttendeeSchema.virtual("full_name").get(function() {
  return `${this.first_name} ${this.last_name}`;
});

AttendeeSchema.virtual("has_room").get(function() {
  return !!(this.dorm_cache?.roomNumber);
});

// JSON Transform
AttendeeSchema.set("toJSON", {
  virtuals: true,
  transform: function(_doc, ret) {
    return {
      _id: ret._id,
      unique_id: ret.unique_id,
      first_name: ret.first_name,
      last_name: ret.last_name,
      full_name: ret.full_name,
      phone: ret.phone,
      email: ret.email,
      gender: ret.gender,
      region: ret.region,
      local_church: ret.local_church,
      campus: ret.campus,
      payment_status: ret.payment_status,
      checked_in: ret.checked_in,
      checked_in_at: ret.checked_in_at,
      checked_in_by: ret.checked_in_by,
      dorm_cache: ret.dorm_cache || { roomNumber: null, bedNumber: null, floor: null, buildingType: null },
      has_room: ret.has_room,
      seminars_cache: ret.seminars_cache || { registered: [], attended: [] },
      group_id: ret.group_id,
      synced_at: ret.synced_at,
      created_at: ret.created_at,
      updated_at: ret.updated_at,
    };
  },
});

const Attendee = mongoose.models.Attendee as mongoose.Model<IAttendee> ||
  mongoose.model<IAttendee>("Attendee", AttendeeSchema);

export default Attendee;