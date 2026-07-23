// src/models/Session.ts
import mongoose, { Schema, Document } from "mongoose";

export interface ISessionAttendee {
  attendeeId: mongoose.Types.ObjectId;
  unique_id: string;
  fullName: string;
  region: string;
  check_in_time?: Date;
  check_in_method?: "qr_code" | "manual";
  status: "on_time" | "late" | "absent";
  checkedInBy?: mongoose.Types.ObjectId;
}

export interface ISession extends Document {
  session_id: string;
  name: string;
  type: "morning" | "afternoon";
  day: number;
  date: Date;
  start_time: string;
  end_time: string;
  on_time_start: string;
  on_time_end: string;
  late_end: string;
  room?: string;
  building?: string;
  attendees: ISessionAttendee[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  
  // Virtuals
  dayLabel?: string;
  location?: string;
  attendanceStats?: {
    total: number;
    on_time: number;
    late: number;
    absent: number;
  };
}

const SessionAttendeeSchema = new Schema<ISessionAttendee>({
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
  check_in_time: {
    type: Date,
  },
  check_in_method: {
    type: String,
    enum: ["qr_code", "manual"],
  },
  status: {
    type: String,
    enum: ["on_time", "late", "absent"],
    required: true,
    default: "absent",
  },
  checkedInBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

const SessionSchema = new Schema<ISession>(
  {
    session_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["morning", "afternoon"],
      required: true,
    },
    day: {
      type: Number,
      required: true,
      min: 1,
      max: 4,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    start_time: {
      type: String,
      required: true,
      match: /^([0-9]{2}):([0-9]{2})$/,
    },
    end_time: {
      type: String,
      required: true,
      match: /^([0-9]{2}):([0-9]{2})$/,
    },
    on_time_start: {
      type: String,
      required: true,
      match: /^([0-9]{2}):([0-9]{2})$/,
    },
    on_time_end: {
      type: String,
      required: true,
      match: /^([0-9]{2}):([0-9]{2})$/,
    },
    late_end: {
      type: String,
      required: true,
      match: /^([0-9]{2}):([0-9]{2})$/,
    },
    room: {
      type: String,
      trim: true,
    },
    building: {
      type: String,
      trim: true,
    },
    attendees: {
      type: [SessionAttendeeSchema],
      default: [],
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
SessionSchema.index({ session_id: 1 }, { unique: true });
SessionSchema.index({ day: 1, type: 1 }, { unique: true });
SessionSchema.index({ date: 1 });
SessionSchema.index({ is_active: 1 });

// Virtuals
SessionSchema.virtual("dayLabel").get(function() {
  const dayNames = ["", "Day 1", "Day 2", "Day 3", "Day 4"];
  return dayNames[this.day] || `Day ${this.day}`;
});

SessionSchema.virtual("location").get(function() {
  let location = "";
  if (this.room) location += `Room ${this.room}`;
  if (this.building) {
    if (location) location += `, ${this.building}`;
    else location = this.building;
  }
  return location || "TBD";
});

SessionSchema.virtual("attendanceStats").get(function() {
  const total = this.attendees.length;
  const onTime = this.attendees.filter((a) => a.status === "on_time").length;
  const late = this.attendees.filter((a) => a.status === "late").length;
  const absent = this.attendees.filter((a) => a.status === "absent").length;
  return { total, on_time: onTime, late, absent };
});

// JSON Transform
SessionSchema.set("toJSON", {
  virtuals: true,
  transform: function(_doc, ret) {
    const { __v, ...rest } = ret;
    return rest;
  },
});

const Session = mongoose.models.Session || 
  mongoose.model<ISession>("Session", SessionSchema);

export default Session;