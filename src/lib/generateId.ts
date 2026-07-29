// src/lib/generateId.ts
import mongoose from "mongoose";
import Group from "../models/Group";

// ✅ Counter Schema for persistent ID generation
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence: { type: Number, default: 0 },
});

// ✅ Only create the model if it doesn't exist
const Counter = mongoose.models.Counter || 
  mongoose.model('Counter', CounterSchema);

export async function generateId(prefix: string): Promise<string> {
  const year = new Date().getFullYear();
  
  try {
    // ✅ Find and increment the counter atomically
    const counter = await Counter.findByIdAndUpdate(
      prefix,
      { $inc: { sequence: 1 } },
      { new: true, upsert: true, lean: true }
    );
    
    const sequence = String(counter.sequence).padStart(6, '0');
    return `${prefix}-${year}-${sequence}`;
  } catch (error) {
    // ✅ Fallback: If counter fails, use timestamp-based ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${year}-${timestamp}${random}`;
  }
}

// ✅ Generate seminar ID
export async function generateSeminarId(): Promise<string> {
  return generateId('SEM');
}

// ✅ Generate building ID
export async function generateBuildingId(): Promise<string> {
  return generateId('BLD');
}

// ✅ Generate room ID
export async function generateRoomId(): Promise<string> {
  return generateId('RM');
}

// ✅ Generate assignment ID
export async function generateAssignmentId(): Promise<string> {
  return generateId('DA');
}

// ✅ Generate group ID
export async function generateGroupId(): Promise<string> {
  return generateId('GRP');
}

// ✅ Generate user ID
export async function generateUserId(): Promise<string> {
  return generateId('USR');
}

// Generate attendee ID with sequence per year
export async function generateAttendeeId(): Promise<string> {
  const year = new Date().getFullYear();
  const Attendee = mongoose.models.Attendee;
  
  if (!Attendee) {
    return `NLS-${year}-001`;
  }
  
  const lastAttendee = await Attendee.findOne(
    { unique_id: { $regex: `^NLS-${year}-` } },
    { unique_id: 1 }
  ).sort({ unique_id: -1 }).lean();

  let sequence = 1;
  if (lastAttendee) {
    const parts = lastAttendee.unique_id.split('-');
    const lastSeq = parseInt(parts[2]);
    if (!isNaN(lastSeq)) {
      sequence = lastSeq + 1;
    }
  }

  return `NLS-${year}-${String(sequence).padStart(3, '0')}`;
}

// Group Code generator


export async function generateSessionId(): Promise<string> {
  return generateId('SES');
}

// ✅ Generate unique group code with format G-1, G-2, G-3, ...
export function generateGroupCode(name: string): string {
  // Extract number from name if it ends with a number
  const match = name.match(/\d+$/);
  if (match) {
    const num = parseInt(match[0]);
    return `G-${num}`;
  }
  
  // Fallback: use hash of name
  const hash = name.substring(0, 2).toUpperCase();
  return `G-${hash}`;
}

// ✅ Generate unique group code with counter
export async function generateUniqueGroupCode(prefix: string = 'G'): Promise<string> {
  const existingGroups = await Group.find({ 
    group_code: { $regex: `^${prefix}-\\d+$` } 
  }).sort({ group_code: -1 }).limit(1);
  
  let lastNumber = 0;
  if (existingGroups.length > 0) {
    const lastCode = existingGroups[0].group_code;
    const match = lastCode.match(/\d+$/);
    if (match) {
      lastNumber = parseInt(match[0]);
    }
  }
  
  return `${prefix}-${lastNumber + 1}`;
}