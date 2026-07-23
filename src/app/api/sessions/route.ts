// src/app/api/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Session from "@/src/models/Session";
import User from "@/src/models/User";
import { requireRole } from "@/src/lib/auth/middleware";
import { generateSessionId } from "@/src/lib/generateId";
import { z } from "zod";

const createSessionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["morning", "afternoon"]),
  day: z.number().min(1).max(4),
  date: z.string().min(1, "Date is required"),
  start_time: z.string().regex(/^([0-9]{2}):([0-9]{2})$/, "Invalid time format (HH:MM)"),
  end_time: z.string().regex(/^([0-9]{2}):([0-9]{2})$/, "Invalid time format (HH:MM)"),
  on_time_start: z.string().regex(/^([0-9]{2}):([0-9]{2})$/, "Invalid time format (HH:MM)"),
  on_time_end: z.string().regex(/^([0-9]{2}):([0-9]{2})$/, "Invalid time format (HH:MM)"),
  late_end: z.string().regex(/^([0-9]{2}):([0-9]{2})$/, "Invalid time format (HH:MM)"),
  room: z.string().optional(),
  building: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const validationResult = createSessionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          message: validationResult.error.issues[0]?.message || "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { 
      name, 
      type, 
      day, 
      date, 
      start_time, 
      end_time, 
      on_time_start, 
      on_time_end, 
      late_end, 
      room, 
      building 
    } = validationResult.data;

    const user = (request as any).user;
    const adminUser = await User.findOne({ user_id: user.user_id });
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Check if session already exists for this day and type
    const existingSession = await Session.findOne({
      day,
      type,
    });

    if (existingSession) {
      return NextResponse.json(
        {
          success: false,
          error: "Session already exists",
          message: `${type} session already exists for Day ${day}`,
        },
        { status: 409 }
      );
    }

    const session = await Session.create({
      session_id: await generateSessionId(),
      name,
      type,
      day,
      date: new Date(date),
      start_time,
      end_time,
      on_time_start,
      on_time_end,
      late_end,
      room,
      building,
      attendees: [],
      is_active: true,
    });

    return NextResponse.json({
      success: true,
      message: `Session "${name}" created for Day ${day}`,
      data: session,
    }, { status: 201 });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create session",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// GET - List all sessions
export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const day = searchParams.get('day');
    const type = searchParams.get('type');

    const query: any = {};
    if (day) query.day = parseInt(day);
    if (type) query.type = type;

    const sessions = await Session.find(query)
      .sort({ day: 1, type: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("Get sessions error:", error);
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