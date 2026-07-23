// src/app/api/sessions/[id]/attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Session, { ISessionAttendee } from "@/src/models/Session"; // ✅ Import ISessionAttendee
import Attendee from "@/src/models/Attendee";
import User from "@/src/models/User";
import { requireRole } from "@/src/lib/auth/middleware";
import mongoose from "mongoose";

// ✅ Helper: Calculate attendance status based on current time (LOCAL TIME)
function calculateAttendanceStatus(
  checkInTime: Date,
  session: any
): "on_time" | "late" | "absent" {
  // Get the time components from the check-in time (in local time)
  const hours = checkInTime.getHours();
  const minutes = checkInTime.getMinutes();
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  
  console.log(`🕐 Check-in time (local): ${timeStr}`);
  console.log(`📋 Session rules:`);
  console.log(`   On-time window: ${session.on_time_start} - ${session.on_time_end}`);
  console.log(`   Late window: ${session.on_time_end} - ${session.late_end}`);
  
  if (timeStr >= session.on_time_start && timeStr <= session.on_time_end) {
    return "on_time";
  } else if (timeStr > session.on_time_end && timeStr <= session.late_end) {
    return "late";
  } else {
    return "absent";
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

    // ✅ Check if attendee already checked in - with proper typing
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

    // Get staff user
    const user = (request as any).user;
    const staffUser = await User.findOne({ user_id: user.user_id });

    // Calculate check-in time and status using LOCAL time
    const checkInTime = new Date();
    const status = calculateAttendanceStatus(checkInTime, session);

    // Add attendee to session
    session.attendees.push({
      attendeeId: attendee._id,
      unique_id: attendee.unique_id,
      fullName: `${attendee.first_name} ${attendee.last_name}`,
      region: attendee.region,
      check_in_time: checkInTime,
      check_in_method: method,
      status: status,
      checkedInBy: staffUser?._id,
    });

    await session.save();

    // Update attendee's sessions_cache
    const updateData: any = {
      $push: {
        "sessions_cache.attended": session.session_id,
      },
    };

    // Push to specific status array
    if (status === "on_time") {
      updateData.$push["sessions_cache.on_time"] = session.session_id;
    } else if (status === "late") {
      updateData.$push["sessions_cache.late"] = session.session_id;
    } else {
      updateData.$push["sessions_cache.absent"] = session.session_id;
    }

    await Attendee.findByIdAndUpdate(attendee._id, updateData);

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
          time: checkInTime,
          status: status,
          checked_by: staffUser?.name || "System",
        },
        attendance_stats: session.attendanceStats,
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