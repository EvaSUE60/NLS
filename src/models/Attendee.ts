// src/models/Attendee.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IAttendee extends Document {
  // ==================== PERSONAL INFORMATION ====================
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
  
  // ==================== DORM ASSIGNMENT ====================
  dorm_assignment_id?: mongoose.Types.ObjectId | null;
  dorm_cache: {
    roomNumber?: string | null;
    bedNumber?: number | null;
    floor?: string | null;
    buildingType?: string | null;
    buildingName?: string | null;
  };
  
  // ==================== SEMINARS ====================
  seminars_cache: {
    registered?: string[];
    attended?: string[];
  };
  
  // ==================== SESSIONS ====================
  sessions_cache: {
    attended: string[];    // session_ids
    on_time: string[];     // session_ids (on-time attendance)
    late: string[];        // session_ids (late attendance)
    absent: string[];      // session_ids (absent)
  };
  
  // ==================== GROUP ====================
  group_id?: mongoose.Types.ObjectId | null;
  synced_at?: Date;
  
  // ==================== ✅ ARRIVAL CHECK-IN ====================
  arrived: boolean;
  arrival_time?: Date;
  arrival_checked_by?: mongoose.Types.ObjectId;
  arrival_method?: "manual" | "bulk" | "qr_code";
  
  // ==================== TIMESTAMPS ====================
  created_at: Date;
  updated_at: Date;
  
  // ==================== VIRTUALS ====================
  full_name?: string;
  has_room?: boolean;
}

const AttendeeSchema = new Schema<IAttendee>(
  {
    // ==================== PERSONAL INFORMATION ====================
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
    
    // ==================== DORM ASSIGNMENT ====================
    dorm_assignment_id: {
      type: Schema.Types.ObjectId,
      ref: "DormAssignment",
      default: null,
    },
    dorm_cache: {
      roomNumber: { type: String, trim: true, default: null },
      bedNumber: { type: Number, min: 1, max: 4, default: null },
      floor: { type: String, trim: true, default: null },
      buildingType: { type: String, enum: ["men", "women"], default: null },
      buildingName: { type: String, trim: true, default: null },
    },
    
    // ==================== SEMINARS ====================
    seminars_cache: {
      registered: [{ type: String, trim: true }],
      attended: [{ type: String, trim: true }],
    },
    
    // ==================== ✅ SESSIONS ====================
    sessions_cache: {
      attended: [{ type: String, trim: true }],
      on_time: [{ type: String, trim: true }],
      late: [{ type: String, trim: true }],
      absent: [{ type: String, trim: true }],
    },
    
    // ==================== GROUP ====================
    group_id: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },
    
    // ==================== SYNC ====================
    synced_at: {
      type: Date,
    },
    
    // ==================== ✅ ARRIVAL CHECK-IN ====================
    arrived: {
      type: Boolean,
      default: false,
      index: true,
    },
    arrival_time: {
      type: Date,
    },
    arrival_checked_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    arrival_method: {
      type: String,
      enum: ["manual", "bulk", "qr_code"],
      default: "manual",
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
// Existing indexes
AttendeeSchema.index({ unique_id: 1 }, { unique: true });
AttendeeSchema.index({ email: 1 });
AttendeeSchema.index({ phone: 1 });
AttendeeSchema.index({ region: 1 });
AttendeeSchema.index({ gender: 1 });
AttendeeSchema.index({ group_id: 1 });
AttendeeSchema.index({ payment_status: 1 });
AttendeeSchema.index({ dorm_assignment_id: 1 });

// Arrival Check-in indexes
AttendeeSchema.index({ arrived: 1 });
AttendeeSchema.index({ arrival_time: 1 });

// ==================== VIRTUALS ====================
AttendeeSchema.virtual("full_name").get(function() {
  return `${this.first_name} ${this.last_name}`;
});

AttendeeSchema.virtual("has_room").get(function() {
  return !!(this.dorm_cache?.roomNumber);
});

// ==================== JSON TRANSFORM ====================
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
      
      // Dorm
      dorm_assignment_id: ret.dorm_assignment_id,
      dorm_cache: ret.dorm_cache || { 
        roomNumber: null, 
        bedNumber: null, 
        floor: null, 
        buildingType: null,
        buildingName: null 
      },
      has_room: ret.has_room,
      
      // Seminars
      seminars_cache: ret.seminars_cache || { registered: [], attended: [] },
      
      // ✅ Sessions
      sessions_cache: ret.sessions_cache || { 
        attended: [], 
        on_time: [], 
        late: [], 
        absent: [] 
      },
      
      // Group
      group_id: ret.group_id,
      
      // Sync
      synced_at: ret.synced_at,
      
      // Arrival Check-in
      arrived: ret.arrived,
      arrival_time: ret.arrival_time,
      arrival_method: ret.arrival_method,
      
      // Timestamps
      created_at: ret.created_at,
      updated_at: ret.updated_at,
    };
  },
});

// ==================== EXPORT ====================
const Attendee = mongoose.models.Attendee as mongoose.Model<IAttendee> ||
  mongoose.model<IAttendee>("Attendee", AttendeeSchema);

export default Attendee;