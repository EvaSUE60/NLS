// src/app/api/sessions/[id]/attendance/route.ts - FIXED VERSION

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Session, { ISessionAttendee } from "@/src/models/Session";
import Attendee from "@/src/models/Attendee";
import User from "@/src/models/User";
import Group from "@/src/models/Group";
import { requireRole } from "@/src/lib/auth/middleware";
import mongoose from "mongoose";
import { generateId } from "@/src/lib/generateId";

// ✅ Helper: Get current UTC time
function getCurrentUTC(): Date {
  return new Date();
}

// ✅ Helper: Get UTC time string (HH:MM)
function getUTCString(date: Date): string {
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// ✅ Helper: Calculate attendance status using UTC
function calculateAttendanceStatusUTC(
  checkInUTC: Date,
  session: any
): "on_time" | "late" | "absent" {
  const timeStr = getUTCString(checkInUTC);
  
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  const checkInMinutes = toMinutes(timeStr);
  const onTimeStartMin = toMinutes(session.on_time_start);
  const onTimeEndMin = toMinutes(session.on_time_end);
  const lateEndMin = toMinutes(session.late_end);
  
  console.log(`📍 Time Debug (UTC):`);
  console.log(`   Check-in time: ${checkInUTC.toISOString()}`);
  console.log(`   Check-in time (HH:MM UTC): ${timeStr}`);
  console.log(`   Session on-time (UTC): ${session.on_time_start} - ${session.on_time_end}`);
  console.log(`   Session late (UTC): ${session.on_time_end} - ${session.late_end}`);
  
  let status: "on_time" | "late" | "absent";
  if (checkInMinutes >= onTimeStartMin && checkInMinutes <= onTimeEndMin) {
    status = "on_time";
  } else if (checkInMinutes > onTimeEndMin && checkInMinutes <= lateEndMin) {
    status = "late";
  } else {
    status = "absent";
  }
  
  console.log(`   Status: ${status}`);
  return status;
}

// ✅ Helper: Update group points for late/absent attendees
async function updateGroupPointsForAttendance(
  attendeeId: string,
  status: "on_time" | "late" | "absent",
  sessionName: string,
  day: number
): Promise<void> {
  try {
    const attendee = await Attendee.findById(attendeeId).lean();
    if (!attendee || !attendee.group_id) return;

    let penalty = 0;
    let reason = "";

    if (status === "late") {
      penalty = -2;
      reason = `Late to ${sessionName} (Day ${day}) - ${attendee.unique_id}`;
    } else if (status === "absent") {
      penalty = -3;
      reason = `Absent from ${sessionName} (Day ${day}) - ${attendee.unique_id}`;
    } else {
      return; // No penalty for on-time
    }

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
    console.log(`✅ Auto-penalty applied: ${penalty} points to group "${group.name}" for ${attendee.unique_id}`);
  } catch (error) {
    console.error("Error updating group points:", error);
  }
}

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

    // Get session
    const session = await Session.findById(id);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
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

    // Check if attendee already checked in
    const existingAttendee = session.attendees.find(
      (a: ISessionAttendee) => a.attendeeId.toString() === attendee._id.toString()
    );

    if (existingAttendee) {
      return NextResponse.json(
        {
          success: false,
          error: "Already checked in",
          message: `${attendee.first_name} ${attendee.last_name} already checked in at ${existingAttendee.check_in_time}`,
          data: {
            check_in_time: existingAttendee.check_in_time,
            status: existingAttendee.status,
          },
        },
        { status: 400 }
      );
    }

    const user = (request as any).user;
    const staffUser = await User.findOne({ user_id: user.user_id });

    // ✅ Get UTC time
    const checkInUTC = getCurrentUTC();
    
    // ✅ Calculate status using UTC (NO conversion)
    const status = calculateAttendanceStatusUTC(checkInUTC, session);
    const timeStr = getUTCString(checkInUTC);

    console.log(`📍 Check-in complete:`);
    console.log(`   Attendee: ${attendee.first_name} ${attendee.last_name}`);
    console.log(`   Session: ${session.name}`);
    console.log(`   Status: ${status}`);
    console.log(`   Time (UTC): ${checkInUTC.toISOString()}`);
    console.log(`   Time (HH:MM UTC): ${timeStr}`);

    // Add attendee to session with UTC time
    session.attendees.push({
      attendeeId: attendee._id,
      unique_id: attendee.unique_id,
      fullName: `${attendee.first_name} ${attendee.last_name}`,
      region: attendee.region,
      check_in_time: checkInUTC,
      check_in_method: method,
      status: status,
      checkedInBy: staffUser?._id,
    });

    await session.save();

    // ✅ Update attendee's sessions_cache
    const updateData: any = {
      $push: {
        "sessions_cache.attended": session.session_id,
      },
    };

    if (status === "on_time") {
      updateData.$push["sessions_cache.on_time"] = session.session_id;
    } else if (status === "late") {
      updateData.$push["sessions_cache.late"] = session.session_id;
    } else {
      updateData.$push["sessions_cache.absent"] = session.session_id;
    }

    await Attendee.findByIdAndUpdate(attendee._id, updateData);

    // ✅ Apply auto-penalty to group if late or absent
    await updateGroupPointsForAttendance(
      attendee._id.toString(),
      status,
      session.name,
      session.day
    );

    // Get updated group info for response
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
      message: `${attendee.first_name} ${attendee.last_name} checked in to "${session.name}" (${status})`,
      data: {
        session: {
          _id: session._id,
          name: session.name,
          day: session.day,
          type: session.type,
        },
        attendee: {
          _id: attendee._id,
          unique_id: attendee.unique_id,
          full_name: `${attendee.first_name} ${attendee.last_name}`,
        },
        check_in: {
          method: method,
          time: checkInUTC, // ✅ UTC time
          time_string: timeStr, // ✅ UTC time string (HH:MM)
          status: status,
          checked_by: staffUser?.name || "System",
        },
        attendance_stats: session.attendanceStats,
        group: groupInfo,
        penalty_applied: status === "late" || status === "absent",
        penalty_points: status === "late" ? -2 : status === "absent" ? -3 : 0,
      },
    });
  } catch (error) {
    console.error("Session check-in error:", error);
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