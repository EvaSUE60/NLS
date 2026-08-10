// src/app/api/seminars/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Seminar from "@/src/models/Seminar";
import User from "@/src/models/User";
import { requireRole } from "@/src/lib/auth/middleware";
import { generateId } from "@/src/lib/generateId";
import { z } from "zod";

// ==================== VALIDATION SCHEMAS ====================

const createSeminarSchema = z.object({
  seminar_key: z.string().min(1, "Seminar key is required"),
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  description: z.string().optional(),
  day: z.number().min(1).max(4),
  date: z.string().min(1, "Date is required"),
  start_time: z.string().regex(/^([0-9]{2}):([0-9]{2})$/, "Invalid time format (HH:MM)"),
  end_time: z.string().regex(/^([0-9]{2}):([0-9]{2})$/, "Invalid time format (HH:MM)"),
  on_time_start: z.string().regex(/^([0-9]{2}):([0-9]{2})$/, "Invalid time format (HH:MM)").optional(),
  on_time_end: z.string().regex(/^([0-9]{2}):([0-9]{2})$/, "Invalid time format (HH:MM)").optional(),
  late_end: z.string().regex(/^([0-9]{2}):([0-9]{2})$/, "Invalid time format (HH:MM)").optional(),
  room: z.string().optional(),
  building: z.string().optional(),
  capacity: z.number().min(1).default(30),
});

const updateSeminarSchema = z.object({
  seminar_key: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  day: z.number().min(1).max(4).optional(),
  date: z.string().optional(),
  start_time: z.string().regex(/^([0-9]{2}):([0-9]{2})$/).optional(),
  end_time: z.string().regex(/^([0-9]{2}):([0-9]{2})$/).optional(),
  on_time_start: z.string().regex(/^([0-9]{2}):([0-9]{2})$/).optional(),
  on_time_end: z.string().regex(/^([0-9]{2}):([0-9]{2})$/).optional(),
  late_end: z.string().regex(/^([0-9]{2}):([0-9]{2})$/).optional(),
  room: z.string().optional(),
  building: z.string().optional(),
  capacity: z.number().min(1).optional(),
  isClosed: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

// src/app/api/seminars/route.ts - Ensure timing fields are included

export async function POST(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    console.log('📝 Creating seminar with body:', body);

    const validationResult = createSeminarSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          message: validationResult.error.issues[0]?.message || "Validation failed",
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
      on_time_start,
      on_time_end,
      late_end,
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

    // ✅ Set attendance timing with defaults if not provided
    const finalOnTimeStart = on_time_start || start_time;
    const finalOnTimeEnd = on_time_end || calculateDefaultOnTimeEnd(start_time);
    const finalLateEnd = late_end || calculateDefaultLateEnd(start_time);

    console.log('📊 Final timing values:', {
      on_time_start: finalOnTimeStart,
      on_time_end: finalOnTimeEnd,
      late_end: finalLateEnd
    });

    // ✅ Create seminar with ALL fields including timing
    const seminar = await Seminar.create({
      seminar_id: await generateId('SEM'),
      seminar_key,
      name,
      category,
      description,
      day,
      date: new Date(date),
      start_time,
      end_time,
      on_time_start: finalOnTimeStart,  // ✅ Must be included
      on_time_end: finalOnTimeEnd,      // ✅ Must be included
      late_end: finalLateEnd,           // ✅ Must be included
      room,
      building,
      capacity,
      participants: [],
      evaluations: [],
      attendance_stats: {
        total: 0,
        on_time: 0,
        late: 0,
        absent: 0,
      },
      isClosed: false,
      is_active: true,
      createdBy: adminUser._id,
    });

    console.log('✅ Seminar created:', {
      id: seminar._id,
      name: seminar.name,
      on_time_start: seminar.on_time_start,
      on_time_end: seminar.on_time_end,
      late_end: seminar.late_end
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

// Helper functions
function calculateDefaultOnTimeEnd(startTime: string): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMinutes = h * 60 + m + 10;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function calculateDefaultLateEnd(startTime: string): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMinutes = h * 60 + m + 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// ==================== GET - LIST SEMINARS ====================

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
    if (isActive !== null && isActive !== undefined) {
      query.is_active = isActive === 'true';
    }
    if (date) query.date = new Date(date);

    const seminars = await Seminar.find(query)
      .sort({ day: 1, start_time: 1 })
      .lean();

    const transformedSeminars = seminars.map(seminar => {
      const participants = seminar.participants || [];
      const total = participants.length;
      const onTime = participants.filter((p: any) => p.status === 'on_time').length;
      const late = participants.filter((p: any) => p.status === 'late').length;
      const absent = participants.filter((p: any) => p.status === 'absent').length;
      
      // ✅ CORRECTED POINTS CALCULATION
      // On-time: 0 points (no bonus)
      // Late: -1 point (penalty)
      // Absent: -2 points (penalty)
      const totalPoints = (onTime * 0) + (late * -1) + (absent * -2);
      
      return {
        ...seminar,
        registeredCount: total,
        attendance_stats: seminar.attendance_stats || {
          total,
          on_time: onTime,
          late: late,
          absent: absent,
        },
        participation_breakdown: {
          on_time: onTime,
          late: late,
          absent: absent,
          total: total,
        },
        points_summary: {
          on_time_bonus: 0,              // ✅ On-time gets 0 points
          late_penalty: late * -1,       // ✅ -1 per late
          absent_penalty: absent * -2,   // ✅ -2 per absent
          total: totalPoints,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedSeminars,
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
