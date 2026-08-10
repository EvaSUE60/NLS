// src/app/api/seminars/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Seminar from "@/src/models/Seminar";
import User from "@/src/models/User";
import { requireRole } from "@/src/lib/auth/middleware";
import { generateId } from "@/src/lib/generateId";
import { SEMINAR_TYPES } from "@/src/data/seminars";

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
      on_time_start,      // ✅ Added
      on_time_end,        // ✅ Added
      late_end,           // ✅ Added
      room_prefix = "Seminar",
      building = "Main Hall",
      capacity = 30
    } = body;

    console.log("📋 Generate seminars request:", { 
      days, date, start_time, end_time, 
      on_time_start, on_time_end, late_end,
      room_prefix, building, capacity 
    });

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

    console.log(`👤 Admin user: ${adminUser.user_id}`);

    let created = 0;
    let skipped = 0;
    const errors = [];
    const createdSeminars = [];

    // ✅ Calculate timing defaults
    const finalOnTimeStart = on_time_start || start_time;
    const finalOnTimeEnd = on_time_end || calculateDefaultOnTimeEnd(start_time);
    const finalLateEnd = late_end || calculateDefaultLateEnd(start_time);

    for (const day of days) {
      console.log(`📅 Processing Day ${day}`);
      
      for (const seminarType of SEMINAR_TYPES) {
        try {
          // Check if already exists
          const existing = await Seminar.findOne({
            seminar_key: seminarType.id,
            day: day,
          });

          if (existing) {
            console.log(`⏭️ Skipping ${seminarType.name} - Day ${day} (already exists)`);
            skipped++;
            continue;
          }

          // Generate unique seminar_id
          const seminarId = await generateId('SEM');
          console.log(`📝 Generated seminar_id: ${seminarId}`);

          const roomNumber = Math.floor(Math.random() * 10) + 1;
          const seminarData = {
            seminar_id: seminarId,
            seminar_key: seminarType.id,
            name: seminarType.name,
            category: seminarType.category || 'General',
            description: seminarType.description || '',
            day: day,
            date: new Date(date),
            start_time: start_time,
            end_time: end_time,
            on_time_start: finalOnTimeStart,    // ✅ Added
            on_time_end: finalOnTimeEnd,        // ✅ Added
            late_end: finalLateEnd,             // ✅ Added
            room: `${room_prefix}-${roomNumber}`,
            building: building,
            capacity: seminarType.maxParticipants || capacity,
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
          };

          console.log(`📝 Creating seminar: ${seminarType.name} - Day ${day}`, seminarData);

          const seminar = await Seminar.create(seminarData);
          created++;
          createdSeminars.push({
            name: seminar.name,
            day: seminar.day,
            seminar_id: seminar.seminar_id,
            on_time_start: seminar.on_time_start,
            on_time_end: seminar.on_time_end,
            late_end: seminar.late_end,
          });
          
          console.log(`✅ Created: ${seminarType.name} - Day ${day}`);
        } catch (error) {
          console.error(`❌ Error creating ${seminarType.name} - Day ${day}:`, error);
          errors.push({
            seminar: seminarType.name,
            day: day,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    console.log(`📊 Summary: Created ${created}, Skipped ${skipped}, Errors ${errors.length}`);

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
        created_seminars: createdSeminars,
        timing_config: {
          start_time,
          end_time,
          on_time_start: finalOnTimeStart,
          on_time_end: finalOnTimeEnd,
          late_end: finalLateEnd,
        },
      },
    });
  } catch (error) {
    console.error("Generate seminars error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate seminars",
        message: error instanceof Error ? error.message : "Something went wrong",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}