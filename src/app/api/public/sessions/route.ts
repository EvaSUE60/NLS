// src/app/api/public/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Session from "@/src/models/Session";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const day = searchParams.get('day');

    const query: any = {
      is_active: true,
    };
    
    if (day) {
      query.day = parseInt(day);
    }

    const sessions = await Session.find(query)
      .sort({ day: 1, type: 1 })
      .lean();

    // Format sessions for public view
    const formattedSessions = sessions.map(session => ({
      _id: session._id,
      session_id: session.session_id,
      name: session.name,
      type: session.type,
      day: session.day,
      date: session.date,
      start_time: session.start_time,
      end_time: session.end_time,
      on_time_start: session.on_time_start,
      on_time_end: session.on_time_end,
      late_end: session.late_end,
      room: session.room,
      building: session.building,
      attendees: session.attendees || [],
      is_active: session.is_active,
      dayLabel: session.dayLabel,
      location: session.location,
      attendanceStats: session.attendanceStats || { total: 0, on_time: 0, late: 0, absent: 0 },
    }));

    return NextResponse.json({
      success: true,
      data: {
        sessions: formattedSessions,
        total: formattedSessions.length,
        day: day ? parseInt(day) : null,
      },
    });
  } catch (error) {
    console.error("Public sessions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch sessions",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}