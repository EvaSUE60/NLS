// src/app/api/seminars/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Seminar from "@/src/models/Seminar";
import User from "@/src/models/User";
import { requireRole } from "@/src/lib/auth/middleware";
import { generateId } from "@/src/lib/generateId";
import { SEMINAR_TYPES } from "@/src/data/seminars";

export async function POST(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const { 
      days = [1, 2, 3, 4], 
      date, 
      start_time = "14:00", 
      end_time = "15:30",
      room_prefix = "Seminar",
      building = "Main Hall",
      capacity = 30
    } = body;

    if (!date) {
      return NextResponse.json(
        { success: false, error: "Date is required" },
        { status: 400 }
      );
    }

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
      for (const seminarType of SEMINAR_TYPES) {
        try {
          // Check if already exists
          const existing = await Seminar.findOne({
            seminar_key: seminarType.id,
            day: day,
          });

          if (existing) {
            skipped++;
            continue;
          }

          const roomNumber = Math.floor(Math.random() * 10) + 1;
          
          await Seminar.create({
            seminar_id: generateId('SEM'),
            seminar_key: seminarType.id,
            name: seminarType.name,
            category: seminarType.category,
            description: seminarType.description,
            day: day,
            date: new Date(date),
            start_time,
            end_time,
            room: `${room_prefix}-${roomNumber}`,
            building: building,
            capacity: seminarType.maxParticipants || capacity,
            participants: [],
            evaluations: [],
            isClosed: false,
            is_active: true,
            createdBy: adminUser._id,
          });
          created++;
        } catch (error) {
          errors.push({
            seminar: seminarType.name,
            day: day,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${created} seminars (${skipped} skipped, ${errors.length} errors)`,
      data: {
        created,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
        total_seminars: created + skipped,
        days_processed: days.length,
        seminars_per_day: SEMINAR_TYPES.length,
      },
    });
  } catch (error) {
    console.error("Generate seminars error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate seminars",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}