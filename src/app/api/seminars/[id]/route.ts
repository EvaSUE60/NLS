// src/app/api/seminars/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Seminar from "@/src/models/Seminar";
import { requireRole } from "@/src/lib/auth/middleware";
import mongoose from "mongoose";
import { z } from "zod";

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

// Helper: Calculate default on-time end
function calculateDefaultOnTimeEnd(startTime: string): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMinutes = h * 60 + m + 10;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Helper: Calculate default late end
function calculateDefaultLateEnd(startTime: string): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMinutes = h * 60 + m + 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// ==================== GET - Get Single Seminar ====================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid seminar ID" },
        { status: 400 }
      );
    }

    const seminar = await Seminar.findById(id).lean();

    if (!seminar) {
      return NextResponse.json(
        { success: false, error: "Seminar not found" },
        { status: 404 }
      );
    }

    // Calculate stats
    const participants = seminar.participants || [];
    const total = participants.length;
    const onTime = participants.filter((p: any) => p.status === 'on_time').length;
    const late = participants.filter((p: any) => p.status === 'late').length;
    const absent = participants.filter((p: any) => p.status === 'absent').length;

    return NextResponse.json({
      success: true,
      data: {
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
          on_time_bonus: 0,
          late_penalty: late * -1,
          absent_penalty: absent * -2,
          total: (late * -1) + (absent * -2),
        },
      },
    });
  } catch (error) {
    console.error("Get seminar error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch seminar",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// ==================== PUT - Update Seminar ====================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid seminar ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validationResult = updateSeminarSchema.safeParse(body);

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

    const updateData = validationResult.data;

    // If start_time changes, update attendance timing defaults
    if (updateData.start_time && !updateData.on_time_start) {
      updateData.on_time_start = updateData.start_time;
      updateData.on_time_end = calculateDefaultOnTimeEnd(updateData.start_time);
      updateData.late_end = calculateDefaultLateEnd(updateData.start_time);
    }

    const seminar = await Seminar.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!seminar) {
      return NextResponse.json(
        { success: false, error: "Seminar not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Seminar "${seminar.name}" updated successfully`,
      data: seminar,
    });
  } catch (error) {
    console.error("Update seminar error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update seminar",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// ==================== DELETE - Delete Seminar ====================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid seminar ID" },
        { status: 400 }
      );
    }

    const seminar = await Seminar.findById(id);

    if (!seminar) {
      return NextResponse.json(
        { success: false, error: "Seminar not found" },
        { status: 404 }
      );
    }

    // Check if there are participants
    if (seminar.participants && seminar.participants.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete seminar with participants",
          message: `Seminar has ${seminar.participants.length} registered participants. Remove them first.`,
        },
        { status: 400 }
      );
    }

    // Hard delete
    await Seminar.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Seminar "${seminar.name}" deleted successfully`,
      data: {
        seminar_id: seminar.seminar_id,
        name: seminar.name,
        day: seminar.day,
      },
    });
  } catch (error) {
    console.error("Delete seminar error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete seminar",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}