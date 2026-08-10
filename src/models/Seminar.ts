// src/models/Seminar.ts
import mongoose, { Schema, Document } from "mongoose";

// ==================== INTERFACES ====================

export interface ISeminarParticipant {
  attendeeId: mongoose.Types.ObjectId;
  unique_id: string;
  fullName: string;
  region: string;
  registeredAt: Date;
  attended: boolean;
  attendedAt?: Date;
  check_in_method?: "qr_code" | "manual";
  checkedInBy?: mongoose.Types.ObjectId;
  status?: 'on_time' | 'late' | 'absent';
  points_awarded?: number;
}

export interface IEvaluation {
  rating: number;
  comment: string;
  submittedBy: mongoose.Types.ObjectId;
  submittedAt: Date;
  attendeeId?: mongoose.Types.ObjectId;
}

export interface ISeminarAttendanceStats {
  total: number;
  on_time: number;
  late: number;
  absent: number;
}

export interface ISeminar extends Document {
  // ==================== IDENTIFICATION ====================
  seminar_id: string;
  seminar_key: string;
  name: string;
  category?: string;
  description?: string;
  
  // ==================== SCHEDULING ====================
  day: number;
  date: Date;
  start_time: string;
  end_time: string;
  
  // ==================== ATTENDANCE TIMING ====================
  on_time_start?: string;
  on_time_end?: string;
  late_end?: string;
  
  // ==================== LOCATION ====================
  room?: string;
  building?: string;
  
  // ==================== CAPACITY ====================
  capacity: number;
  participants: ISeminarParticipant[];
  
  // ==================== EVALUATIONS ====================
  evaluations: IEvaluation[];
  
  // ==================== STATS ====================
  attendance_stats?: ISeminarAttendanceStats;
  
  // ==================== STATUS ====================
  isClosed: boolean;
  is_active: boolean;
  createdBy: mongoose.Types.ObjectId;
  
  // ==================== TIMESTAMPS ====================
  created_at: Date;
  updated_at: Date;
  
  // ==================== VIRTUALS ====================
  registeredCount?: number;
  remainingSlots?: number;
  isFull?: boolean;
  dayLabel?: string;
  location?: string;
  averageRating?: number;
}

// ==================== SCHEMAS ====================

const SeminarParticipantSchema = new Schema<ISeminarParticipant>({
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
  registeredAt: {
    type: Date,
    default: Date.now,
  },
  attended: {
    type: Boolean,
    default: false,
  },
  attendedAt: {
    type: Date,
  },
  check_in_method: {
    type: String,
    enum: ["qr_code", "manual"],
  },
  checkedInBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["on_time", "late", "absent"],
  },
  points_awarded: {
    type: Number,
    default: 0,
  },
});

const EvaluationSchema = new Schema<IEvaluation>({
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
  },
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  attendeeId: {
    type: Schema.Types.ObjectId,
    ref: "Attendee",
  },
});

const SeminarAttendanceStatsSchema = new Schema<ISeminarAttendanceStats>({
  total: { type: Number, default: 0 },
  on_time: { type: Number, default: 0 },
  late: { type: Number, default: 0 },
  absent: { type: Number, default: 0 },
});

// ==================== MAIN SCHEMA ====================

const SeminarSchema = new Schema<ISeminar>(
  {
    // Identification
    seminar_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    seminar_key: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    
    // Scheduling
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
    
    // Attendance Timing - ✅ Make these required
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
    
    // Location
    room: {
      type: String,
      trim: true,
    },
    building: {
      type: String,
      trim: true,
    },
    
    // Capacity
    capacity: {
      type: Number,
      required: true,
      min: 1,
      default: 30,
    },
    participants: {
      type: [SeminarParticipantSchema],
      default: [],
    },
    
    // Evaluations
    evaluations: {
      type: [EvaluationSchema],
      default: [],
    },
    
    // Stats
    attendance_stats: {
      type: SeminarAttendanceStatsSchema,
      default: () => ({
        total: 0,
        on_time: 0,
        late: 0,
        absent: 0,
      }),
    },
    
    // Status
    isClosed: {
      type: Boolean,
      default: false,
      index: true,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

SeminarSchema.index({ seminar_id: 1 }, { unique: true });
SeminarSchema.index({ seminar_key: 1, day: 1 }, { unique: true });
SeminarSchema.index({ day: 1 });
SeminarSchema.index({ date: 1 });
SeminarSchema.index({ name: 1 });
SeminarSchema.index({ isClosed: 1 });
SeminarSchema.index({ is_active: 1 });

// ==================== VIRTUALS ====================

SeminarSchema.virtual("registeredCount").get(function() {
  return this.participants.length;
});

SeminarSchema.virtual("remainingSlots").get(function() {
  return Math.max(this.capacity - this.participants.length, 0);
});

SeminarSchema.virtual("isFull").get(function() {
  return this.isClosed || this.participants.length >= this.capacity;
});

SeminarSchema.virtual("dayLabel").get(function() {
  const dayNames = ["", "Day 1", "Day 2", "Day 3", "Day 4"];
  return dayNames[this.day] || `Day ${this.day}`;
});

SeminarSchema.virtual("location").get(function() {
  let location = "";
  if (this.room) location += `Room ${this.room}`;
  if (this.building) {
    if (location) location += `, ${this.building}`;
    else location = this.building;
  }
  return location || "TBD";
});

SeminarSchema.virtual("averageRating").get(function() {
  if (!this.evaluations || this.evaluations.length === 0) return null;
  const total = this.evaluations.reduce((sum: number, e: IEvaluation) => sum + e.rating, 0);
  return Math.round((total / this.evaluations.length) * 10) / 10;
});

// ==================== METHODS ====================

SeminarSchema.methods.updateAttendanceStats = function() {
  const stats = {
    total: this.participants.length,
    on_time: this.participants.filter((p: ISeminarParticipant) => p.status === 'on_time').length,
    late: this.participants.filter((p: ISeminarParticipant) => p.status === 'late').length,
    absent: this.participants.filter((p: ISeminarParticipant) => p.status === 'absent').length,
  };
  
  this.attendance_stats = stats;
  return stats;
};

SeminarSchema.methods.hasAttended = function(attendeeId: mongoose.Types.ObjectId): boolean {
  return this.participants.some(
    (p: ISeminarParticipant) => 
      p.attendeeId.toString() === attendeeId.toString() && 
      p.attended === true
  );
};

// ==================== STATIC METHODS ====================

SeminarSchema.statics.hasAttendedTopic = async function(
  attendeeId: mongoose.Types.ObjectId,
  seminarKey: string
): Promise<boolean> {
  const seminar = await this.findOne({
    seminar_key: seminarKey,
    "participants.attendeeId": attendeeId,
    "participants.attended": true,
  });
  return !!seminar;
};

SeminarSchema.statics.getAttendeeSeminars = async function(
  attendeeId: mongoose.Types.ObjectId
): Promise<ISeminar[]> {
  return this.find({
    "participants.attendeeId": attendeeId,
  }).sort({ day: 1 });
};

SeminarSchema.statics.getAttendeeSeminarsByDay = async function(
  attendeeId: mongoose.Types.ObjectId,
  day: number
): Promise<ISeminar[]> {
  return this.find({
    day: day,
    "participants.attendeeId": attendeeId,
  });
};

// ==================== PRE-HOOKS ====================

SeminarSchema.pre('save', async function (this: ISeminar) {
  // Update attendance stats if there are participants
  if (this.participants && this.participants.length > 0) {
    this.attendance_stats = {
      total: this.participants.length,
      on_time: this.participants.filter((p: ISeminarParticipant) => p.status === 'on_time').length,
      late: this.participants.filter((p: ISeminarParticipant) => p.status === 'late').length,
      absent: this.participants.filter((p: ISeminarParticipant) => p.status === 'absent').length,
    };
  }
});

// ==================== TO JSON / TO OBJECT ====================

SeminarSchema.set("toJSON", {
  virtuals: true,
  transform: function(_doc, ret) {
    const { __v, ...rest } = ret;
    return rest;
  },
});

SeminarSchema.set("toObject", {
  virtuals: true,
});

// ==================== MODEL ====================

const Seminar = mongoose.models.Seminar || 
  mongoose.model<ISeminar>("Seminar", SeminarSchema);

export default Seminar;