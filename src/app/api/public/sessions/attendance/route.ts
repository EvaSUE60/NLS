// src/app/api/public/sessions/attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Session, { ISessionAttendee } from "@/src/models/Session";
import Attendee from "@/src/models/Attendee";
import Group from "@/src/models/Group";
import { generateId } from "@/src/lib/generateId";

function calculateAttendanceStatus(
  checkInTime: Date,
  session: any
): "on_time" | "late" | "absent" {
  const hours = checkInTime.getHours();
  const minutes = checkInTime.getMinutes();
  const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  
  if (timeStr >= session.on_time_start && timeStr <= session.on_time_end) {
    return "on_time";
  } else if (timeStr > session.on_time_end && timeStr <= session.late_end) {
    return "late";
  } else {
    return "absent";
  }
}

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
      return;
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
  } catch (error) {
    console.error("Error updating group points:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { nlsId, confirmNlsId, sessionId } = body;

    if (!nlsId || !confirmNlsId || !sessionId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (nlsId !== confirmNlsId) {
      return NextResponse.json(
        { success: false, error: "NLS IDs do not match" },
        { status: 400 }
      );
    }

    const attendee = await Attendee.findOne({ unique_id: nlsId });
    if (!attendee) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    if (!session.is_active) {
      return NextResponse.json(
        { success: false, error: "Session is not active" },
        { status: 400 }
      );
    }

    // Check if already checked in
    const existingAttendee = session.attendees.find(
      (a: ISessionAttendee) => a.attendeeId.toString() === attendee._id.toString()
    );

    if (existingAttendee) {
      return NextResponse.json(
        {
          success: false,
          error: "Already checked in",
          message: `${attendee.first_name} ${attendee.last_name} already checked in`,
        },
        { status: 400 }
      );
    }

    const checkInTime = new Date();
    const status = calculateAttendanceStatus(checkInTime, session);

    // Add attendee to session
    session.attendees.push({
      attendeeId: attendee._id,
      unique_id: attendee.unique_id,
      fullName: `${attendee.first_name} ${attendee.last_name}`,
      region: attendee.region,
      check_in_time: checkInTime,
      check_in_method: "manual",
      status: status,
    });

    await session.save();

    // Update attendee's sessions_cache
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

    // Apply auto-penalty to group
    await updateGroupPointsForAttendance(
      attendee._id.toString(),
      status,
      session.name,
      session.day
    );

    return NextResponse.json({
      success: true,
      message: `Checked in to ${session.name}`,
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
          method: "manual",
          time: checkInTime,
          status: status,
        },
        attendance_stats: session.attendanceStats,
        penalty_applied: status === "late" || status === "absent",
        penalty_points: status === "late" ? -2 : status === "absent" ? -3 : 0,
      },
    });
  } catch (error) {
    console.error("Public session check-in error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check in",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}