// src/app/api/seminars/[id]/attendance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Seminar, { IParticipant } from "@/src/models/Seminar"; // ✅ Import IParticipant
import Attendee from "@/src/models/Attendee";
import User from "@/src/models/User";
import { requireRole } from "@/src/lib/auth/middleware";
import mongoose from "mongoose";

// POST - Check-in attendee to seminar by NLS ID
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { nls_id, method = "manual" } = body;

    if (!nls_id) {
      return NextResponse.json(
        { success: false, error: "NLS ID is required (e.g., NLS-2026-001)" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid seminar ID" },
        { status: 400 }
      );
    }

    // Get seminar
    const seminar = await Seminar.findById(id);
    if (!seminar) {
      return NextResponse.json(
        { success: false, error: "Seminar not found" },
        { status: 404 }
      );
    }

    // Find attendee by NLS ID
    const attendee = await Attendee.findOne({ unique_id: nls_id });
    if (!attendee) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Attendee not found",
          message: `No attendee found with NLS ID: ${nls_id}`
        },
        { status: 404 }
      );
    }

    // ✅ Find participant in seminar with proper typing
    const participantIndex = seminar.participants.findIndex(
      (p: IParticipant) => p.attendeeId.toString() === attendee._id.toString()
    );

    if (participantIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Not registered",
          message: `${attendee.first_name} ${attendee.last_name} (${attendee.unique_id}) is not registered for this seminar`,
        },
        { status: 400 }
      );
    }

    // Check if already attended
    if (seminar.participants[participantIndex].attended) {
      return NextResponse.json(
        {
          success: false,
          error: "Already checked in",
          message: `${attendee.first_name} ${attendee.last_name} already checked in at ${seminar.participants[participantIndex].attendedAt}`,
        },
        { status: 400 }
      );
    }

    // Get staff user
    const user = (request as any).user;
    const staffUser = await User.findOne({ user_id: user.user_id });

    // Update participant
    seminar.participants[participantIndex].attended = true;
    seminar.participants[participantIndex].attendedAt = new Date();
    seminar.participants[participantIndex].check_in_method = method;
    seminar.participants[participantIndex].checkedInBy = staffUser?._id;

    await seminar.save();

    // Update attendee's seminars_cache
    await Attendee.findByIdAndUpdate(attendee._id, {
      $push: {
        "seminars_cache.attended": seminar.seminar_id,
      },
    });

    // ✅ Count attendance with proper typing
    const totalCheckedIn = seminar.participants.filter(
      (p: IParticipant) => p.attended
    ).length;

    return NextResponse.json({
      success: true,
      message: `${attendee.first_name} ${attendee.last_name} (${attendee.unique_id}) checked in to "${seminar.name}"`,
      data: {
        seminar: {
          _id: seminar._id,
          name: seminar.name,
          day: seminar.day,
        },
        attendee: {
          _id: attendee._id,
          unique_id: attendee.unique_id,
          full_name: `${attendee.first_name} ${attendee.last_name}`,
        },
        check_in: {
          method: method,
          time: new Date(),
          checked_by: staffUser?.name || "System",
        },
        attendance_stats: {
          total_checked_in: totalCheckedIn,
          total_registered: seminar.participants.length,
        },
      },
    });
  } catch (error) {
    console.error("Seminar check-in error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check in attendee",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}