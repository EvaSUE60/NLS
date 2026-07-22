// src/app/api/seminars/[id]/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Seminar, { IParticipant } from "@/src/models/Seminar"; // ✅ Import IParticipant
import Attendee from "@/src/models/Attendee";
import User from "@/src/models/User";
import { requireRole } from "@/src/lib/auth/middleware";
import mongoose from "mongoose";

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
    const { nls_id } = body;

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

    const seminar = await Seminar.findById(id);
    if (!seminar) {
      return NextResponse.json(
        { success: false, error: "Seminar not found" },
        { status: 404 }
      );
    }

    if (!seminar.is_active) {
      return NextResponse.json(
        { success: false, error: "Seminar is not active" },
        { status: 400 }
      );
    }

    if (seminar.isClosed) {
      return NextResponse.json(
        { success: false, error: "Seminar registration is closed" },
        { status: 400 }
      );
    }

    if (seminar.participants.length >= seminar.capacity) {
      return NextResponse.json(
        { success: false, error: "Seminar is full" },
        { status: 400 }
      );
    }

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

    // ✅ RULE 1: Check if attendee already registered for a seminar on this day
    const existingDaySeminar = await Seminar.findOne({
      day: seminar.day,
      "participants.attendeeId": attendee._id,
    });

    if (existingDaySeminar) {
      return NextResponse.json(
        {
          success: false,
          error: "Already registered",
          message: `${attendee.first_name} ${attendee.last_name} is already registered for "${existingDaySeminar.name}" on Day ${seminar.day}`,
          data: {
            seminar_id: existingDaySeminar.seminar_id,
            seminar_name: existingDaySeminar.name,
            day: existingDaySeminar.day,
          },
        },
        { status: 400 }
      );
    }

    // ✅ RULE 2: Check if attendee already registered OR attended this topic on ANY day
    const existingTopicRegistration = await Seminar.findOne({
      seminar_key: seminar.seminar_key,
      "participants.attendeeId": attendee._id,
    });

    if (existingTopicRegistration) {
      // ✅ Fix: Add proper typing to find() callback
      const existingParticipant = existingTopicRegistration.participants.find(
        (p: IParticipant) => p.attendeeId.toString() === attendee._id.toString()
      );
      
      const day = existingTopicRegistration.day;
      const status = existingParticipant?.attended ? "attended" : "registered";
      
      return NextResponse.json(
        {
          success: false,
          error: status === "attended" ? "Already attended" : "Already registered",
          message: `${attendee.first_name} ${attendee.last_name} already ${status} "${seminar.name}" on Day ${day}`,
          data: {
            seminar_id: existingTopicRegistration.seminar_id,
            seminar_name: existingTopicRegistration.name,
            day: day,
            status: status,
          },
        },
        { status: 400 }
      );
    }

    // ✅ RULE 3: Check if attendee already registered for this exact seminar
    const alreadyRegistered = seminar.participants.some(
      (p: IParticipant) => p.attendeeId.toString() === attendee._id.toString()
    );

    if (alreadyRegistered) {
      return NextResponse.json(
        {
          success: false,
          error: "Already registered",
          message: `${attendee.first_name} ${attendee.last_name} already registered for "${seminar.name}"`,
        },
        { status: 400 }
      );
    }

    const user = (request as any).user;
    const staffUser = await User.findOne({ user_id: user.user_id });

    seminar.participants.push({
      attendeeId: attendee._id,
      unique_id: attendee.unique_id,
      fullName: `${attendee.first_name} ${attendee.last_name}`,
      region: attendee.region,
      registeredAt: new Date(),
      attended: false,
    });

    await seminar.save();

    await Attendee.findByIdAndUpdate(attendee._id, {
      $push: {
        "seminars_cache.registered": seminar.seminar_id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${attendee.first_name} ${attendee.last_name} (${attendee.unique_id}) registered for "${seminar.name}" on Day ${seminar.day}`,
      data: {
        seminar: {
          _id: seminar._id,
          seminar_id: seminar.seminar_id,
          name: seminar.name,
          day: seminar.day,
          start_time: seminar.start_time,
          end_time: seminar.end_time,
          room: seminar.room,
          building: seminar.building,
        },
        attendee: {
          _id: attendee._id,
          unique_id: attendee.unique_id,
          full_name: `${attendee.first_name} ${attendee.last_name}`,
          region: attendee.region,
        },
        registered_count: seminar.participants.length,
        remaining_slots: seminar.capacity - seminar.participants.length,
      },
    });
  } catch (error) {
    console.error("Register seminar error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to register for seminar",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}