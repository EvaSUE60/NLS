// src/app/api/attendees/[id]/seminars/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Seminar from "@/src/models/Seminar";
import Attendee from "@/src/models/Attendee";
import { requireRole } from "@/src/lib/auth/middleware";
import mongoose from "mongoose";

// ✅ Define Participant type
interface IParticipant {
  attendeeId: mongoose.Types.ObjectId;
  unique_id: string;
  fullName: string;
  region: string;
  registeredAt: Date;
  attended: boolean;
  attendedAt?: Date;
  check_in_method?: "qr_code" | "manual";
  checkedInBy?: mongoose.Types.ObjectId;
}

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
        { success: false, error: "Invalid attendee ID" },
        { status: 400 }
      );
    }

    const attendee = await Attendee.findById(id);
    if (!attendee) {
      return NextResponse.json(
        { success: false, error: "Attendee not found" },
        { status: 404 }
      );
    }

    // Get all seminars this attendee is registered for
    const registeredSeminars = await Seminar.find({
      "participants.attendeeId": id,
    }).sort({ day: 1 });

    // ✅ Get all seminars this attendee has attended - with proper typing
    const attendedSeminars = registeredSeminars.filter((seminar) =>
      seminar.participants.some((p: IParticipant) => 
        p.attendeeId.toString() === id && p.attended
      )
    );

    // Group by day
    const byDay = registeredSeminars.reduce((acc: any, seminar) => {
      const day = seminar.day;
      if (!acc[day]) acc[day] = [];
      acc[day].push(seminar);
      return acc;
    }, {});

    // Get available seminars (not registered) for each day
    const registeredKeys = new Set(
      registeredSeminars.map((s) => `${s.seminar_key}-${s.day}`)
    );

    return NextResponse.json({
      success: true,
      data: {
        attendee: {
          _id: attendee._id,
          unique_id: attendee.unique_id,
          full_name: `${attendee.first_name} ${attendee.last_name}`,
          region: attendee.region,
        },
        summary: {
          total_registered: registeredSeminars.length,
          total_attended: attendedSeminars.length,
          total_days: Object.keys(byDay).length,
        },
        by_day: byDay,
        seminars: {
          registered: registeredSeminars,
          attended: attendedSeminars,
        },
      },
    });
  } catch (error) {
    console.error("Get attendee seminars error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get attendee seminars",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}