// src/app/api/students/[unique_id]/info/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import Group, { IGroupMember } from "@/src/models/Group";
import Seminar, { IParticipant } from "@/src/models/Seminar";
import Session, { ISessionAttendee } from "@/src/models/Session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ unique_id: string }> }
) {
  try {
    await connectDB();

    const { unique_id } = await params;

    // Validate NLS ID format
    if (!unique_id || !unique_id.startsWith("NLS-")) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid NLS ID format. Use format: NLS-2026-XXX" 
        },
        { status: 400 }
      );
    }

    // ==================== FIND STUDENT ====================
    const attendee = await Attendee.findOne({ unique_id });
    if (!attendee) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Student not found", 
          message: `No student found with ID: ${unique_id}` 
        },
        { status: 404 }
      );
    }

    // ==================== 1. STUDENT PROFILE ====================
    const studentProfile = {
      unique_id: attendee.unique_id,
      full_name: `${attendee.first_name} ${attendee.last_name}`,
      first_name: attendee.first_name,
      last_name: attendee.last_name,
      gender: attendee.gender,
      region: attendee.region,
      local_church: attendee.local_church,
      campus: attendee.campus,
      payment_status: attendee.payment_status,
      arrived: attendee.arrived,
      arrival_time: attendee.arrival_time,
      arrival_method: attendee.arrival_method,
    };

    // ==================== 2. ROOM & BED INFORMATION ====================
    let roomInfo = null;
    if (attendee.dorm_cache?.roomNumber) {
      roomInfo = {
        room_number: attendee.dorm_cache.roomNumber,
        bed_number: attendee.dorm_cache.bedNumber,
        floor: attendee.dorm_cache.floor,
        building_name: attendee.dorm_cache.buildingName,
        building_type: attendee.dorm_cache.buildingType,
      };
    }

    // ==================== 3. GROUP INFORMATION ====================
    let groupInfo = null;
    if (attendee.group_id) {
      const group = await Group.findById(attendee.group_id);
      if (group) {
        // ✅ Fix: Add type annotation for 'm'
        const member = group.members.find(
          (m: IGroupMember) => m.attendeeId.toString() === attendee._id.toString()
        );

        groupInfo = {
          group_id: group.group_id,
          name: group.name,
          group_code: group.group_code,
          points: group.points,
          total_earned: group.total_earned,
          total_lost: group.total_lost,
          member_count: group.members.length,
          max_size: group.max_size,
          joined_at: member?.joinedAt || null,
          region_distribution: group.region_distribution,
          is_full: group.members.length >= group.max_size,
        };
      }
    }

    // ==================== 4. SEMINAR INFORMATION ====================
    const registeredSeminars = await Seminar.find({
      "participants.attendeeId": attendee._id,
    }).sort({ day: 1 });

    // ✅ Fix: Add type annotation for 'p'
    const seminarList = registeredSeminars.map((seminar) => {
      const participant = seminar.participants.find(
        (p: IParticipant) => p.attendeeId.toString() === attendee._id.toString()
      );
      return {
        seminar_id: seminar.seminar_id,
        name: seminar.name,
        category: seminar.category,
        day: seminar.day,
        date: seminar.date,
        start_time: seminar.start_time,
        end_time: seminar.end_time,
        room: seminar.room,
        building: seminar.building,
        attended: participant?.attended || false,
        attended_at: participant?.attendedAt || null,
        registered_at: participant?.registeredAt || null,
        check_in_method: participant?.check_in_method || null,
      };
    });

    const seminarSummary = {
      total_registered: registeredSeminars.length,
      total_attended: seminarList.filter((s) => s.attended).length,
      seminars: seminarList,
    };

    // ==================== 5. SESSION ATTENDANCE ====================
    const sessions = await Session.find({
      "attendees.attendeeId": attendee._id,
    }).sort({ day: 1, type: 1 });

    // ✅ Fix: Add type annotation for 'a'
    const sessionHistory = sessions.map((session) => {
      const attendance = session.attendees.find(
        (a: ISessionAttendee) => a.attendeeId.toString() === attendee._id.toString()
      );
      return {
        session_id: session.session_id,
        name: session.name,
        day: session.day,
        type: session.type,
        date: session.date,
        start_time: session.start_time,
        end_time: session.end_time,
        room: session.room,
        building: session.building,
        status: attendance?.status || "absent",
        check_in_time: attendance?.check_in_time || null,
        check_in_method: attendance?.check_in_method || null,
      };
    });

    const sessionSummary = {
      total_sessions: sessionHistory.length,
      on_time: sessionHistory.filter((s) => s.status === "on_time").length,
      late: sessionHistory.filter((s) => s.status === "late").length,
      absent: sessionHistory.filter((s) => s.status === "absent").length,
      attendance_rate: sessionHistory.length > 0 
        ? `${Math.round((sessionHistory.filter(s => s.status === "on_time").length / sessionHistory.length) * 100)}%` 
        : "N/A",
      sessions: sessionHistory,
    };

    // ==================== 6. ARRIVAL CHECK-IN ====================
    const arrivalInfo = {
      arrived: attendee.arrived,
      arrival_time: attendee.arrival_time,
      arrival_method: attendee.arrival_method,
    };

    // ==================== 7. SEMINARS CACHE ====================
    const seminarsCache = attendee.seminars_cache || { registered: [], attended: [] };

    // ==================== 8. SESSIONS CACHE ====================
    const sessionsCache = attendee.sessions_cache || { 
      attended: [], 
      on_time: [], 
      late: [], 
      absent: [] 
    };

    // ==================== 9. COMPLETE RESPONSE ====================
    return NextResponse.json({
      success: true,
      data: {
        student: studentProfile,
        room: roomInfo,
        group: groupInfo,
        seminars: seminarSummary,
        sessions: sessionSummary,
        arrival: arrivalInfo,
        summary: {
          has_room: !!roomInfo,
          has_group: !!groupInfo,
          total_seminars: seminarSummary.total_registered,
          total_sessions: sessionSummary.total_sessions,
          attendance_rate: sessionSummary.attendance_rate,
        },
        cache: {
          seminars: seminarsCache,
          sessions: sessionsCache,
        },
      },
    });
  } catch (error) {
    console.error("Student info error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch student information",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}