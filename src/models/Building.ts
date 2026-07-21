// src/models/Building.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IBuilding extends Document {
  building_id: string;
  name: string;
  type: "men" | "women";
  floors: number;          // Match the route expectation
  total_rooms: number;
  occupied_rooms: number;
  capacity: number;
  current_occupancy: number;
  address?: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  
  // Virtuals
  available_rooms?: number;
  available_beds?: number;
  occupancy_rate?: number;
}

const BuildingSchema = new Schema<IBuilding>(
  {
    building_id: {
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
    type: {
      type: String,
      enum: ["men", "women"],
      required: true,
    },
    floors: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    total_rooms: {
      type: Number,
      default: 0,
    },
    occupied_rooms: {
      type: Number,
      default: 0,
    },
    capacity: {
      type: Number,
      default: 0,
    },
    current_occupancy: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
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
BuildingSchema.index({ building_id: 1 }, { unique: true });
BuildingSchema.index({ name: 1 }, { unique: true });
BuildingSchema.index({ type: 1 });
BuildingSchema.index({ is_active: 1 });

// Virtuals
BuildingSchema.virtual("available_rooms").get(function() {
  return this.total_rooms - this.occupied_rooms;
});

BuildingSchema.virtual("available_beds").get(function() {
  return this.capacity - this.current_occupancy;
});

BuildingSchema.virtual("occupancy_rate").get(function() {
  return this.capacity > 0 ? (this.current_occupancy / this.capacity) * 100 : 0;
});

// JSON Transform
BuildingSchema.set("toJSON", {
  virtuals: true,
  transform: function(_doc, ret) {
// @ts-ignore
    delete ret.__v;
    return ret;
  },
});

const Building = mongoose.models.Building || 
  mongoose.model<IBuilding>("Building", BuildingSchema);

export default Building;