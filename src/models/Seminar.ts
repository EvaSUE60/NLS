// src/models/Seminar.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IParticipant {
  attendeeId: mongoose.Types.ObjectId;
  unique_id: string;
  fullName: string;
  region: string;
  registeredAt: Date;
  attended: boolean;
  attendedAt?: Date;
  check_in_method?: "qr_code" | "manual";
  checkedInBy?: mongoose.Types.ObjectId;
}

export interface IEvaluation {
  rating: number;
  comment: string;
  submittedBy: mongoose.Types.ObjectId;
  submittedAt: Date;
  attendeeId?: mongoose.Types.ObjectId;
}

export interface ISeminar extends Document {
  // ==================== IDENTIFICATION ====================
  seminar_id: string;              // SEM-2026-001
  seminar_key: string;             // "engaging-islam"
  name: string;                    // "Engaging Islam"
  category?: string;
  description?: string;
  
  // ==================== SCHEDULING ====================
  day: number;                     // 1, 2, 3, 4
  date: Date;
  start_time: string;              // "15:00"
  end_time: string;                // "16:30"
  
  // ==================== LOCATION ====================
  room?: string;
  building?: string;
  
  // ==================== CAPACITY ====================
  capacity: number;
  participants: IParticipant[];
  
  // ==================== EVALUATIONS ====================
  evaluations: IEvaluation[];
  
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

const ParticipantSchema = new Schema<IParticipant>({
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

const SeminarSchema = new Schema<ISeminar>(
  {
    // ==================== IDENTIFICATION ====================
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
    
    // ==================== SCHEDULING ====================
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
    
    // ==================== LOCATION ====================
    room: {
      type: String,
      trim: true,
    },
    building: {
      type: String,
      trim: true,
    },
    
    // ==================== CAPACITY ====================
    capacity: {
      type: Number,
      required: true,
      min: 1,
      default: 30,
    },
    participants: {
      type: [ParticipantSchema],
      default: [],
    },
    
    // ==================== EVALUATIONS ====================
    evaluations: {
      type: [EvaluationSchema],
      default: [],
    },
    
    // ==================== STATUS ====================
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