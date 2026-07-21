// src/models/DormAssignment.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IDormAssignment extends Document {
  assignment_id: string;
  attendee_id: mongoose.Types.ObjectId;
  room_id: mongoose.Types.ObjectId;
  building_id: mongoose.Types.ObjectId;
  bed_number: number;
  assigned_by: mongoose.Types.ObjectId;
  assigned_at: Date;
  status: "active" | "changed" | "cancelled";
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const DormAssignmentSchema = new Schema<IDormAssignment>(
  {
    assignment_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    attendee_id: {
      type: Schema.Types.ObjectId,
      ref: "Attendee",
      required: true,
    },
    room_id: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    building_id: {
      type: Schema.Types.ObjectId,
      ref: "Building",
      required: true,
    },
    bed_number: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    assigned_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assigned_at: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "changed", "cancelled"],
      default: "active",
    },
    notes: {
      type: String,
      trim: true,
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
DormAssignmentSchema.index({ assignment_id: 1 }, { unique: true });
DormAssignmentSchema.index({ attendee_id: 1, status: 1 });
DormAssignmentSchema.index({ room_id: 1, bed_number: 1 }, { unique: true });
DormAssignmentSchema.index({ building_id: 1 });
DormAssignmentSchema.index({ status: 1 });

// Ensure one active assignment per attendee
DormAssignmentSchema.index({ attendee_id: 1, status: 1 }, { unique: true, partialFilterExpression: { status: "active" } });

// JSON Transform
DormAssignmentSchema.set("toJSON", {
  virtuals: true,
  transform: function(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const DormAssignment = mongoose.models.DormAssignment || 
  mongoose.model<IDormAssignment>("DormAssignment", DormAssignmentSchema);

export default DormAssignment;