// src/app/api/public/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Seminar, { IParticipant } from "@/src/models/Seminar";
import Attendee from "@/src/models/Attendee";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { nlsId, confirmNlsId, seminarId } = body;

    // Validate required fields
    if (!nlsId || !confirmNlsId || !seminarId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify IDs match
    if (nlsId !== confirmNlsId) {
      return NextResponse.json(
        { success: false, error: "NLS IDs do not match" },
        { status: 400 }
      );
    }

    // Find attendee
    const attendee = await Attendee.findOne({ unique_id: nlsId });
    if (!attendee) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    // Find seminar
    const seminar = await Seminar.findById(seminarId);
    if (!seminar) {
      return NextResponse.json(
        { success: false, error: "Seminar not found" },
        { status: 404 }
      );
    }

    // Check if seminar is active
    if (!seminar.is_active) {
      return NextResponse.json(
        { success: false, error: "Seminar is not active" },
        { status: 400 }
      );
    }

    // Check if seminar is closed
    if (seminar.isClosed) {
      return NextResponse.json(
        { success: false, error: "Seminar registration is closed" },
        { status: 400 }
      );
    }

    // Check if seminar is full
    if (seminar.participants.length >= seminar.capacity) {
      return NextResponse.json(
        { success: false, error: "Seminar is full" },
        { status: 400 }
      );
    }

    // Check if attendee already registered for a seminar on this day
    const existingDaySeminar = await Seminar.findOne({
      day: seminar.day,
      "participants.attendeeId": attendee._id,
    });

    if (existingDaySeminar) {
      return NextResponse.json(
        {
          success: false,
          error: "Already registered for this day",
          message: `You are already registered for "${existingDaySeminar.name}" on Day ${seminar.day}`,
        },
        { status: 400 }
      );
    }

    // Check if attendee already registered for this topic
    const existingTopicRegistration = await Seminar.findOne({
      seminar_key: seminar.seminar_key,
      "participants.attendeeId": attendee._id,
    });

    if (existingTopicRegistration) {
      const existingParticipant = existingTopicRegistration.participants.find(
        (p: IParticipant) => p.attendeeId.toString() === attendee._id.toString()
      );
      
      const day = existingTopicRegistration.day;
      const status = existingParticipant?.attended ? "attended" : "registered";
      
      return NextResponse.json(
        {
          success: false,
          error: status === "attended" ? "Already attended" : "Already registered",
          message: `You already ${status} "${seminar.name}" on Day ${day}`,
        },
        { status: 400 }
      );
    }

    // Check if already registered for this exact seminar
    const alreadyRegistered = seminar.participants.some(
      (p: IParticipant) => p.attendeeId.toString() === attendee._id.toString()
    );

    if (alreadyRegistered) {
      return NextResponse.json(
        {
          success: false,
          error: "Already registered",
          message: `You are already registered for "${seminar.name}"`,
        },
        { status: 400 }
      );
    }

    // Register attendee
    seminar.participants.push({
      attendeeId: attendee._id,
      unique_id: attendee.unique_id,
      fullName: `${attendee.first_name} ${attendee.last_name}`,
      region: attendee.region,
      registeredAt: new Date(),
      attended: false,
    });

    await seminar.save();

    // Update attendee's seminars cache
    await Attendee.findByIdAndUpdate(attendee._id, {
      $push: {
        "seminars_cache.registered": seminar.seminar_id,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully registered for "${seminar.name}"`,
      data: {
        seminar: {
          id: seminar._id,
          name: seminar.name,
          day: seminar.day,
          dayLabel: `Day ${seminar.day}`,
          registeredCount: seminar.participants.length,
          capacity: seminar.capacity,
        },
        attendee: {
          id: attendee._id,
          unique_id: attendee.unique_id,
          fullName: `${attendee.first_name} ${attendee.last_name}`,
          region: attendee.region,
        },
      },
    });
  } catch (error) {
    console.error("Public registration error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Registration failed",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}