// src/lib/generateId.ts
import mongoose from "mongoose";

// Generic counter for sequential IDs
let counter = 0;

export function generateId(prefix: string): string {
  counter++;
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(counter).padStart(6, '0')}`;
}

// Building ID generator
export function generateBuildingId(): string {
  return generateId('BLD');
}

// Room ID generator
export function generateRoomId(): string {
  return generateId('RM');
}

// Assignment ID generator
export function generateAssignmentId(): string {
  return generateId('DA');
}

// User ID generator
export function generateUserId(): string {
  return generateId('USR');
}

// Attendee ID generator
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

// Group ID generator
export function generateGroupId(): string {
  return generateId('GRP');
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