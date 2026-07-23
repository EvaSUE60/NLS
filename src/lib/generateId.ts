// src/lib/generateId.ts
import mongoose from "mongoose";

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
export function generateGroupCode(name: string): string {
  const words = name.split(' ');
  const code = words.map(word => word[0]).join('').toUpperCase();
  if (code.length < 2) {
    return `${code}${Math.floor(Math.random() * 100)}`;
  }
  return code;
}

export async function generateSessionId(): Promise<string> {
  return generateId('SES');
}