// src/app/api/seminars/[id]/attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Seminar, { ISeminarParticipant } from "@/src/models/Seminar";
import Attendee from "@/src/models/Attendee";
import User from "@/src/models/User";
import Group from "@/src/models/Group";
import { requireRole } from "@/src/lib/auth/middleware";
import mongoose from "mongoose";
import { generateId } from "@/src/lib/generateId";

// Default target timezone for the event site
const EVENT_TIMEZONE = "Africa/Addis_Ababa";

// ==================== HELPERS ====================

// Helper: Get current UTC Date
function getCurrentUTC(): Date {
  return new Date();
}

// Helper: Convert UTC Date to local HH:MM string in event timezone
function getLocalTimeString(date: Date, timeZone: string = EVENT_TIMEZONE): string {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timeZone,
  });
  return formatter.format(date);
}

// Helper: Convert time string to minutes
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

// Helper: Calculate default on-time end (10 minutes after start)
function calculateDefaultOnTimeEnd(startTime: string): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMinutes = h * 60 + m + 10;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Helper: Calculate default late end (30 minutes after start)
function calculateDefaultLateEnd(startTime: string): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMinutes = h * 60 + m + 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// ✅ Helper: Calculate attendance status using local event timezone
function calculateSeminarAttendanceStatus(
  checkInUTC: Date,
  seminar: any,
  timeZone: string = EVENT_TIMEZONE
): "on_time" | "late" | "absent" {
  // Extract local HH:MM string from UTC check-in timestamp
  const localTimeStr = getLocalTimeString(checkInUTC, timeZone);
  
  const checkInMinutes = toMinutes(localTimeStr);
  
  // Use seminar-specific timing or fallback to defaults
  const onTimeStart = seminar.on_time_start || seminar.start_time;
  const onTimeEnd = seminar.on_time_end || calculateDefaultOnTimeEnd(seminar.start_time);
  const lateEnd = seminar.late_end || calculateDefaultLateEnd(seminar.start_time);
  
  const onTimeStartMin = toMinutes(onTimeStart);
  const onTimeEndMin = toMinutes(onTimeEnd);
  const lateEndMin = toMinutes(lateEnd);
  
  console.log(`📍 Seminar Attendance Time Debug (${timeZone}):`);
  console.log(`   Check-in UTC: ${checkInUTC.toISOString()}`);
  console.log(`   Check-in Local: ${localTimeStr}`);
  console.log(`   Check-in minutes: ${checkInMinutes}`);
  console.log(`   On-time range: ${onTimeStart} - ${onTimeEnd} (${onTimeStartMin} - ${onTimeEndMin} min)`);
  console.log(`   Late range: ${onTimeEnd} - ${lateEnd} (${onTimeEndMin} - ${lateEndMin} min)`);
  
  let status: "on_time" | "late" | "absent";
  
  if (checkInMinutes >= onTimeStartMin && checkInMinutes <= onTimeEndMin) {
    status = "on_time";
  } else if (checkInMinutes > onTimeEndMin && checkInMinutes <= lateEndMin) {
    status = "late";
  } else {
    status = "absent";
  }
  
  console.log(`   ✅ Calculated Status: ${status}`);
  return status;
}

// ✅ Helper: Update group points for seminar attendance
// Scoring: On Time = 0 points, Late = -1 point, Absent = -2 points
async function updateGroupPointsForSeminarAttendance(
  attendeeId: string,
  status: "on_time" | "late" | "absent",
  seminarName: string,
  seminarId: string,
  day: number
): Promise<{ points: number; reason: string }> {
  try {
    const attendee = await Attendee.findById(attendeeId).lean();
    if (!attendee || !attendee.group_id) {
      return { points: 0, reason: "No group assigned" };
    }

    let points = 0;
    let reason = "";
    let activityType: "bonus" | "penalty" | "auto_penalty" = "bonus";

    // ✅ SCORING RULES FOR SEMINARS:
    // On-time: 0 points (no bonus, no penalty)
    // Late: -1 point (penalty)
    // Absent: -2 points (penalty)
    switch (status) {
      case "on_time":
        points = 0;
        reason = `On-time attendance for seminar "${seminarName}" (Day ${day}) - ${attendee.unique_id}`;
        activityType = "bonus";
        break;
      case "late":
        points = -1;
        reason = `Late attendance for seminar "${seminarName}" (Day ${day}) - ${attendee.unique_id}`;
        activityType = "penalty";
        break;
      case "absent":
        points = -2;
        reason = `Absent from seminar "${seminarName}" (Day ${day}) - ${attendee.unique_id}`;
        activityType = "penalty";
        break;
    }

    // If points is 0, just return without updating group
    if (points === 0) {
      console.log(`ℹ️ On-time attendance for "${seminarName}" - No points awarded (0 points)`);
      return { points: 0, reason: "On-time attendance - No points awarded" };
    }

    const group = await Group.findById(attendee.group_id);
    if (!group) return { points: 0, reason: "Group not found" };

    // Update group points
    group.points += points;
    if (points > 0) {
      group.total_earned += points;
    } else {
      group.total_lost += Math.abs(points);
    }

    // Add activity record
    group.activities.push({
      activity_id: await generateId('ACT'),
      type: activityType,
      description: reason,
      points: points,
      reason: reason,
      created_at: new Date(),
    });

    // Update seminar stats in group if it exists
    if (group.seminar_stats) {
      group.seminar_stats.total_attended += 1;
      if (status === 'on_time') {
        group.seminar_stats.on_time += 1;
      } else if (status === 'late') {
        group.seminar_stats.late += 1;
        group.seminar_stats.total_points_lost += Math.abs(points);
      } else {
        group.seminar_stats.absent += 1;
        group.seminar_stats.total_points_lost += Math.abs(points);
      }
    }

    await group.save();
    console.log(`✅ Seminar points applied: ${points} points to group "${group.name}" for ${attendee.unique_id}`);

    return { points, reason };
  } catch (error) {
    console.error("Error updating group points for seminar:", error);
    return { points: 0, reason: "Error updating points" };
  }
}

// ==================== MAIN POST HANDLER ====================

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

    // Validate NLS ID
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

    // Check if seminar is active
    if (!seminar.is_active) {
      return NextResponse.json(
        { success: false, error: "Seminar is not active" },
        { status: 400 }
      );
    }

    console.log(`📋 Seminar: ${seminar.name}`);
    console.log(`📋 Timing: on_time_start=${seminar.on_time_start}, on_time_end=${seminar.on_time_end}, late_end=${seminar.late_end}`);

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
      (p: ISeminarParticipant) => p.attendeeId.toString() === attendee._id.toString()
    );

    if (participantIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Not registered",
          message: `${attendee.first_name} ${attendee.last_name} is not registered for this seminar. Please register first.`,
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
          message: `${attendee.first_name} ${attendee.last_name} already checked in to this seminar`,
        },
        { status: 400 }
      );
    }

    // Get staff user
    const user = (request as any).user;
    const staffUser = await User.findOne({ user_id: user.user_id });

    // Calculate status using UTC with timezone
    const checkInUTC = getCurrentUTC();
    const status = calculateSeminarAttendanceStatus(checkInUTC, seminar);
    const localTimeStr = getLocalTimeString(checkInUTC);

    console.log(`📍 Check-in complete:`);
    console.log(`   Attendee: ${attendee.first_name} ${attendee.last_name}`);
    console.log(`   Seminar: ${seminar.name}`);
    console.log(`   Status: ${status}`);
    console.log(`   Time UTC: ${checkInUTC.toISOString()}`);
    console.log(`   Time Local: ${localTimeStr}`);

    // Update participant
    seminar.participants[participantIndex].attended = true;
    seminar.participants[participantIndex].attendedAt = checkInUTC;
    seminar.participants[participantIndex].check_in_method = method;
    seminar.participants[participantIndex].checkedInBy = staffUser?._id;
    seminar.participants[participantIndex].status = status;

    // Calculate points awarded based on status
    let pointsAwarded = 0;
    if (status === 'late') pointsAwarded = -1;
    else if (status === 'absent') pointsAwarded = -2;
    // on_time = 0 points

    seminar.participants[participantIndex].points_awarded = pointsAwarded;

    await seminar.save();

    // Update attendee's seminars_cache
    await Attendee.findByIdAndUpdate(attendee._id, {
      $push: {
        "seminars_cache.attended": seminar.seminar_id,
      },
    });

    // Update group points for seminar attendance
    const groupPoints = await updateGroupPointsForSeminarAttendance(
      attendee._id.toString(),
      status,
      seminar.name,
      seminar._id.toString(),
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
          total_earned: group.total_earned,
          total_lost: group.total_lost,
          seminar_stats: group.seminar_stats || null,
        };
      }
    }

    // Get updated seminar stats
    const updatedSeminar = await Seminar.findById(id);
    const totalParticipants = updatedSeminar?.participants?.length || 0;
    const onTimeCount = updatedSeminar?.participants?.filter((p: any) => p.status === 'on_time').length || 0;
    const lateCount = updatedSeminar?.participants?.filter((p: any) => p.status === 'late').length || 0;
    const absentCount = updatedSeminar?.participants?.filter((p: any) => p.status === 'absent').length || 0;

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
          time: checkInUTC,
          time_string_local: localTimeStr,
          status: status,
          checked_by: staffUser?.name || "System",
        },
        attendance_stats: {
          total: totalParticipants,
          on_time: onTimeCount,
          late: lateCount,
          absent: absentCount,
        },
        group: groupInfo,
        points_awarded: groupPoints.points,
        points_reason: groupPoints.reason,
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