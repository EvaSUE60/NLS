// src/app/api/seminars/[id]/attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Seminar, { IParticipant } from "@/src/models/Seminar";
import Attendee from "@/src/models/Attendee";
import User from "@/src/models/User";
import Group from "@/src/models/Group";
import { requireRole } from "@/src/lib/auth/middleware";
import mongoose from "mongoose";
import { generateId } from "@/src/lib/generateId";

// Helper: Calculate attendance status for seminar
function calculateSeminarAttendanceStatus(
  checkInTime: Date,
  seminar: any
): "on_time" | "late" | "absent" {
  const hours = checkInTime.getHours();
  const minutes = checkInTime.getMinutes();
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  
  console.log(`🕐 Check-in time (local): ${timeStr}`);
  console.log(`📋 Seminar rules:`);
  console.log(`   On-time: ${seminar.start_time}`);
  console.log(`   Late window: ${seminar.start_time} - ${seminar.end_time}`);
  
  // Seminar: On-time means before or at start time
  if (timeStr <= seminar.start_time) {
    return "on_time";
  } else if (timeStr > seminar.start_time && timeStr <= seminar.end_time) {
    return "late";
  } else {
    return "absent";
  }
}

// ✅ Helper: Update group points for seminar attendance
async function updateGroupPointsForSeminarAttendance(
  attendeeId: string,
  status: "on_time" | "late" | "absent",
  seminarName: string,
  day: number
): Promise<void> {
  try {
    const attendee = await Attendee.findById(attendeeId).lean();
    if (!attendee || !attendee.group_id) return;

    // ✅ Only penalize for LATE
    if (status !== "late") return;

    const penalty = -1;
    const reason = `Late to Seminar: ${seminarName} (Day ${day}) - ${attendee.unique_id}`;

    const group = await Group.findById(attendee.group_id);
    if (!group) return;

    group.points += penalty;
    group.total_lost += Math.abs(penalty);

    group.activities.push({
      activity_id: await generateId('ACT'),
      type: "auto_penalty",
      description: reason,
      points: penalty,
      reason: reason,
      created_at: new Date(),
    });

    await group.save();
    console.log(`✅ Seminar auto-penalty applied: ${penalty} points to group "${group.name}"`);
  } catch (error) {
    console.error("Error updating group points:", error);
  }
}

// POST - Check-in attendee to seminar by NLS ID
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { nls_id, method = "manual" } = body;

    if (!nls_id) {
      return NextResponse.json(
        { success: false, error: "NLS ID is required" },
        { status: 400 }
      );
    }

    // Get seminar
    const seminar = await Seminar.findById(id);
    if (!seminar) {
      return NextResponse.json(
        { success: false, error: "Seminar not found" },
        { status: 404 }
      );
    }

    // Get attendee
    const attendee = await Attendee.findOne({ unique_id: nls_id });
    if (!attendee) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Attendee not found",
          message: `No attendee found with NLS ID: ${nls_id}`
        },
        { status: 404 }
      );
    }

    // Find participant in seminar
    const participantIndex = seminar.participants.findIndex(
      (p: IParticipant) => p.attendeeId.toString() === attendee._id.toString()
    );

    if (participantIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Not registered",
          message: `${attendee.first_name} ${attendee.last_name} is not registered for this seminar`,
        },
        { status: 400 }
      );
    }

    // Check if already attended
    if (seminar.participants[participantIndex].attended) {
      return NextResponse.json(
        {
          success: false,
          error: "Already checked in",
          message: `${attendee.first_name} ${attendee.last_name} already checked in`,
        },
        { status: 400 }
      );
    }

    const user = (request as any).user;
    const staffUser = await User.findOne({ user_id: user.user_id });

    // Calculate status
    const checkInTime = new Date();
    const status = calculateSeminarAttendanceStatus(checkInTime, seminar);

    // Update participant
    seminar.participants[participantIndex].attended = true;
    seminar.participants[participantIndex].attendedAt = checkInTime;
    seminar.participants[participantIndex].check_in_method = method;
    seminar.participants[participantIndex].checkedInBy = staffUser?._id;

    await seminar.save();

    // Update attendee's seminars_cache
    await Attendee.findByIdAndUpdate(attendee._id, {
      $push: {
        "seminars_cache.attended": seminar.seminar_id,
      },
    });

    // ✅ Apply auto-penalty for LATE
    await updateGroupPointsForSeminarAttendance(
      attendee._id.toString(),
      status,
      seminar.name,
      seminar.day
    );

    // Get updated group info
    let groupInfo = null;
    if (attendee.group_id) {
      const group = await Group.findById(attendee.group_id);
      if (group) {
        groupInfo = {
          _id: group._id,
          name: group.name,
          points: group.points,
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: `${attendee.first_name} ${attendee.last_name} checked in to "${seminar.name}" (${status})`,
      data: {
        seminar: {
          _id: seminar._id,
          name: seminar.name,
          day: seminar.day,
        },
        attendee: {
          _id: attendee._id,
          unique_id: attendee.unique_id,
          full_name: `${attendee.first_name} ${attendee.last_name}`,
        },
        check_in: {
          method: method,
          time: checkInTime,
          status: status,
          checked_by: staffUser?.name || "System",
        },
        group: groupInfo,
        penalty_applied: status === "late" ? true : false,
        penalty_points: status === "late" ? -1 : 0,
      },
    });
  } catch (error) {
    console.error("Seminar check-in error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check in attendee",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}