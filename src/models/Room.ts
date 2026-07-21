// src/models/Room.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IRoom extends Document {
  room_id: string;
  building_id: mongoose.Types.ObjectId;
  room_number: string;
  floor: number;
  floor_name: string;
  capacity: number;
  occupants: mongoose.Types.ObjectId[];
  current_occupancy: number;
  is_full: boolean;
  bed_numbers: number[];
  check_in_status: "empty" | "partial" | "full";
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  
  // Virtuals
  available_slots?: number;
  occupant_count?: number;
}

const RoomSchema = new Schema<IRoom>(
  {
    room_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    building_id: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      required: true,
    },
    room_number: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: Number,
      required: true,
      min: 1,
    },
    floor_name: {
      type: String,
      required: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 2,
      max: 4,
      default: 4,
    },
    occupants: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attendee",
      },
    ],
    current_occupancy: {
      type: Number,
      default: 0,
    },
    is_full: {
      type: Boolean,
      default: false,
    },
    bed_numbers: {
      type: [Number],
      default: [1, 2, 3, 4],
    },
    check_in_status: {
      type: String,
      enum: ["empty", "partial", "full"],
      default: "empty",
    },
    is_active: {
      type: Boolean,
      default: true,
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
RoomSchema.index({ room_id: 1 }, { unique: true });
RoomSchema.index({ building_id: 1, room_number: 1 }, { unique: true });
RoomSchema.index({ building_id: 1 });
RoomSchema.index({ floor: 1 });
RoomSchema.index({ is_full: 1 });
RoomSchema.index({ is_active: 1 });

// Virtuals
RoomSchema.virtual("available_slots").get(function() {
  return Math.max(this.capacity - this.current_occupancy, 0);
});

RoomSchema.virtual("occupant_count").get(function() {
  return this.current_occupancy || this.occupants.length;
});

// ✅ FIXED: Pre-save middleware with async/await (Mongoose 7+)
RoomSchema.pre("save", async function() {
  this.current_occupancy = this.occupants.length;
  this.is_full = this.occupants.length >= this.capacity;
  
  if (this.occupants.length === 0) {
    this.check_in_status = "empty";
  } else if (this.occupants.length >= this.capacity) {
    this.check_in_status = "full";
  } else {
    this.check_in_status = "partial";
  }
  
  if (this.bed_numbers.length !== this.capacity) {
    this.bed_numbers = Array.from({ length: this.capacity }, (_, i) => i + 1);
  }
});

// JSON Transform
RoomSchema.set("toJSON", {
  virtuals: true,
  transform: function(_doc, ret) {
    // @ts-ignore
    delete ret.__v;
    return ret;
  },
});

RoomSchema.set("toObject", {
  virtuals: true,
});


const Room = mongoose.models.Room || mongoose.model<IRoom>("Room", RoomSchema);

export default Room;