// src/app/api/public/sessions/attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Session, { ISessionAttendee } from "@/src/models/Session";
import Attendee from "@/src/models/Attendee";
import Group from "@/src/models/Group";
import { generateId } from "@/src/lib/generateId";

// Default target timezone for the event site
const EVENT_TIMEZONE = "Africa/Addis_Ababa";

// ✅ Helper: Get current UTC Date
function getCurrentUTC(): Date {
  return new Date();
}

// ✅ Helper: Convert UTC Date to local HH:MM string in event timezone
function getLocalTimeString(date: Date, timeZone: string = EVENT_TIMEZONE): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timeZone,
  });
  return formatter.format(date);
}

// ✅ Helper: Calculate attendance status using local event timezone
function calculateAttendanceStatus(
  checkInUTC: Date,
  session: any,
  timeZone: string = EVENT_TIMEZONE
): "on_time" | "late" | "absent" {
  // Extract local HH:MM string from UTC check-in timestamp
  const localTimeStr = getLocalTimeString(checkInUTC, timeZone);
  
  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  const checkInMinutes = toMinutes(localTimeStr);
  const onTimeStartMin = toMinutes(session.on_time_start);
  const onTimeEndMin = toMinutes(session.on_time_end);
  const lateEndMin = toMinutes(session.late_end);
  
  console.log(`📍 Time Debug (${timeZone}):`);
  console.log(`   Check-in UTC: ${checkInUTC.toISOString()}`);
  console.log(`   Check-in Local: ${localTimeStr}`);
  console.log(`   On-time range: ${session.on_time_start} - ${session.on_time_end}`);
  console.log(`   Late range: ${session.on_time_end} - ${session.late_end}`);
  console.log(`   Check-in minutes: ${checkInMinutes}`);
  console.log(`   On-time start minutes: ${onTimeStartMin}`);
  console.log(`   On-time end minutes: ${onTimeEndMin}`);
  console.log(`   Late end minutes: ${lateEndMin}`);
  
  let status: "on_time" | "late" | "absent";
  
  // Handle case where on_time_start could be > on_time_end (crosses midnight)
  if (onTimeStartMin <= onTimeEndMin) {
    // Normal case: on_time_start <= on_time_end
    if (checkInMinutes >= onTimeStartMin && checkInMinutes <= onTimeEndMin) {
      status = "on_time";
    } else if (checkInMinutes > onTimeEndMin && checkInMinutes <= lateEndMin) {
      status = "late";
    } else {
      status = "absent";
    }
  } else {
    // Crosses midnight: on_time_start > on_time_end
    if (checkInMinutes >= onTimeStartMin || checkInMinutes <= onTimeEndMin) {
      status = "on_time";
    } else if (checkInMinutes > onTimeEndMin && checkInMinutes <= lateEndMin) {
      status = "late";
    } else {
      status = "absent";
    }
  }
  
  console.log(`   ✅ Calculated Status: ${status}`);
  return status;
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
    console.log(`✅ Auto-penalty applied: ${penalty} points to group "${group.name}" for ${attendee.unique_id}`);
  } catch (error) {
    console.error("Error updating group points:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { nlsId, confirmNlsId, sessionId } = body;

    console.log('📝 Public check-in request:', { nlsId, confirmNlsId, sessionId });

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

    console.log(`📍 Session: ${session.name}`);
    console.log(`📍 Session times: on_time_start=${session.on_time_start}, on_time_end=${session.on_time_end}, late_end=${session.late_end}`);

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
          data: {
            check_in_time: existingAttendee.check_in_time,
            status: existingAttendee.status,
          },
        },
        { status: 400 }
      );
    }

    // ✅ Capture UTC timestamp
    const checkInUTC = getCurrentUTC();
    
    // ✅ Convert checkInUTC to local event time & calculate attendance status
    const status = calculateAttendanceStatus(checkInUTC, session);
    const localTimeStr = getLocalTimeString(checkInUTC);

    console.log(`📍 Check-in complete:`);
    console.log(`   Attendee: ${attendee.first_name} ${attendee.last_name}`);
    console.log(`   Session: ${session.name}`);
    console.log(`   Status: ${status}`);
    console.log(`   Time UTC: ${checkInUTC.toISOString()}`);
    console.log(`   Time Local: ${localTimeStr}`);

    // Add attendee to session
    session.attendees.push({
      attendeeId: attendee._id,
      unique_id: attendee.unique_id,
      fullName: `${attendee.first_name} ${attendee.last_name}`,
      region: attendee.region,
      check_in_time: checkInUTC,
      check_in_method: "manual",
      status: status,
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

    // ✅ Return response with same structure as the staff API
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
          method: "manual",
          time: checkInUTC,
          time_string_local: localTimeStr, // ✅ This is the key field for the frontend
          status: status,
          checked_by: "Student Self Check-in",
        },
        attendance_stats: session.attendanceStats,
        group: groupInfo,
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