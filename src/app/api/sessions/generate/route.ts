// src/app/api/sessions/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Session from "@/src/models/Session";
import User from "@/src/models/User";
import { requireRole } from "@/src/lib/auth/middleware";
import { generateSessionId } from "@/src/lib/generateId";

export async function POST(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const { 
      days = [1, 2, 3, 4],
      date = new Date().toISOString().split('T')[0],
      morning_time = "09:00",
      morning_end = "12:00",
      afternoon_time = "14:00",
      afternoon_end = "17:00",
      on_time_window = 5, // minutes after start
      late_window = 25,   // minutes after start
      room_prefix = "Room",
      building = "Main Hall"
    } = body;

    const user = (request as any).user;
    const adminUser = await User.findOne({ user_id: user.user_id });
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const day of days) {
      const sessionTypes = [
        { type: "morning", start: morning_time, end: morning_end },
        { type: "afternoon", start: afternoon_time, end: afternoon_end },
      ];

      for (const sessionType of sessionTypes) {
        try {
          // Check if exists
          const existing = await Session.findOne({ day, type: sessionType.type });
          if (existing) {
            skipped++;
            continue;
          }

          const startTime = sessionType.start;
          const endTime = sessionType.end;
          
          // Calculate time windows
          const [hours, minutes] = startTime.split(':').map(Number);
          const onTimeStart = new Date(0, 0, 0, hours, minutes - 20);
          const onTimeEnd = new Date(0, 0, 0, hours, minutes + on_time_window);
          const lateEnd = new Date(0, 0, 0, hours, minutes + late_window);
          
          const onTimeStartStr = onTimeStart.toTimeString().slice(0, 5);
          const onTimeEndStr = onTimeEnd.toTimeString().slice(0, 5);
          const lateEndStr = lateEnd.toTimeString().slice(0, 5);

          const sessionDate = new Date(date);
          sessionDate.setDate(sessionDate.getDate() + day - 1);

          const dayNames = ["", "Day 1", "Day 2", "Day 3", "Day 4"];
          
          await Session.create({
            session_id: await generateSessionId(),
            name: `${sessionType.type === "morning" ? "Morning" : "Afternoon"} Session - ${dayNames[day]}`,
            type: sessionType.type,
            day: day,
            date: sessionDate,
            start_time: startTime,
            end_time: endTime,
            on_time_start: onTimeStartStr,
            on_time_end: onTimeEndStr,
            late_end: lateEndStr,
            room: `${room_prefix} ${day === 1 ? 'A' : String.fromCharCode(64 + day)}`,
            building: building,
            attendees: [],
            is_active: true,
          });
          created++;
        } catch (error) {
          errors.push({
            day,
            type: sessionType.type,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${created} sessions (${skipped} skipped, ${errors.length} errors)`,
      data: {
        created,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
        total_sessions: created + skipped,
        days_processed: days.length,
        sessions_per_day: 2,
      },
    });
  } catch (error) {
    console.error("Generate sessions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate sessions",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}