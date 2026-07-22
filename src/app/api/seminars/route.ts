// src/app/api/seminars/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Seminar from "@/src/models/Seminar";
import User from "@/src/models/User";
import { requireRole } from "@/src/lib/auth/middleware";
import { generateId } from "@/src/lib/generateId"; // ✅ Import the function
import { z } from "zod";

const createSeminarSchema = z.object({
  seminar_key: z.string().min(1, "Seminar key is required"),
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  description: z.string().optional(),
  day: z.number().min(1).max(4),
  date: z.string().min(1, "Date is required"),
  start_time: z.string().regex(/^([0-9]{2}):([0-9]{2})$/, "Invalid time format (HH:MM)"),
  end_time: z.string().regex(/^([0-9]{2}):([0-9]{2})$/, "Invalid time format (HH:MM)"),
  room: z.string().optional(),
  building: z.string().optional(),
  capacity: z.number().min(1).default(30),
});

export async function POST(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const validationResult = createSeminarSchema.safeParse(body);

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
      seminar_key, 
      name, 
      category, 
      description, 
      day, 
      date, 
      start_time, 
      end_time, 
      room, 
      building, 
      capacity 
    } = validationResult.data;

    const user = (request as any).user;
    const adminUser = await User.findOne({ user_id: user.user_id });
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const existingSeminar = await Seminar.findOne({
      seminar_key,
      day,
    });

    if (existingSeminar) {
      return NextResponse.json(
        {
          success: false,
          error: "Seminar already exists",
          message: `Seminar "${name}" already exists for Day ${day}`,
        },
        { status: 409 }
      );
    }

    // ✅ Create seminar with await on generateId
    const seminar = await Seminar.create({
      seminar_id: await generateId('SEM'), // ✅ CRITICAL: Add await here
      seminar_key,
      name,
      category,
      description,
      day,
      date: new Date(date),
      start_time,
      end_time,
      room,
      building,
      capacity,
      participants: [],
      evaluations: [],
      isClosed: false,
      is_active: true,
      createdBy: adminUser._id,
    });

    return NextResponse.json({
      success: true,
      message: `Seminar "${name}" created for Day ${day}`,
      data: seminar,
    }, { status: 201 });
  } catch (error) {
    console.error("Create seminar error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create seminar",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}
// GET - List all seminars with filters
export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const day = searchParams.get('day');
    const seminar_key = searchParams.get('seminar_key');
    const isActive = searchParams.get('isActive');
    const date = searchParams.get('date');

    const query: any = {};
    if (day) query.day = parseInt(day);
    if (seminar_key) query.seminar_key = seminar_key;
    if (isActive !== null) query.is_active = isActive === 'true';
    if (date) query.date = new Date(date);

    const seminars = await Seminar.find(query)
      .sort({ day: 1, name: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: seminars,
    });
  } catch (error) {
    console.error("Get seminars error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch seminars",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}