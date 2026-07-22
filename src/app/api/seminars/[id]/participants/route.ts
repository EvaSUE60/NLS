// src/app/api/seminars/[id]/participants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Seminar, { IParticipant } from "@/src/models/Seminar"; // ✅ Import IParticipant
import { requireRole } from "@/src/lib/auth/middleware";
import mongoose from "mongoose";

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

    const seminar = await Seminar.findById(id);
    if (!seminar) {
      return NextResponse.json(
        { success: false, error: "Seminar not found" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const attended = searchParams.get('attended');

    let participants = seminar.participants;
    
    // ✅ Fix: Add proper typing to filter callback
    if (attended !== null && attended !== undefined) {
      participants = participants.filter(
        (p: IParticipant) => p.attended === (attended === 'true')
      );
    }

    // ✅ Fix: Add proper typing to filter callbacks in stats
    const totalAttended = seminar.participants.filter(
      (p: IParticipant) => p.attended
    ).length;
    
    const totalNotAttended = seminar.participants.filter(
      (p: IParticipant) => !p.attended
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        seminar: {
          _id: seminar._id,
          name: seminar.name,
          day: seminar.day,
        },
        stats: {
          total_registered: seminar.participants.length,
          attended: totalAttended,
          not_attended: totalNotAttended,
          capacity: seminar.capacity,
          remaining_slots: seminar.capacity - seminar.participants.length,
        },
        participants: participants,
      },
    });
  } catch (error) {
    console.error("Get participants error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get participants",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}