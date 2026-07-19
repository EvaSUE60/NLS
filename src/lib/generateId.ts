// src/lib/generateId.ts
import Attendee from "@/src/models/Attendee";

export function generateUserId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `USR-${year}-${random}`;
}

export async function generateAttendeeId(): Promise<string> {
  const year = new Date().getFullYear();
  
  // Find the highest sequence number for this year
  const lastAttendee = await Attendee.findOne(
    { unique_id: { $regex: `^NLS-${year}-` } },
    { unique_id: 1 }
  )
    .sort({ unique_id: -1 })
    .lean();

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

export function generateGroupId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `GRP-${year}-${random}`;
}

export function generateGroupCode(name: string): string {
  const words = name.split(' ');
  const code = words.map(word => word[0]).join('').toUpperCase();
  if (code.length < 2) {
    return `${code}${Math.floor(Math.random() * 100)}`;
  }
  return code;
}