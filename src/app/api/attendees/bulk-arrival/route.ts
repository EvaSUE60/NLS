// src/app/api/attendees/bulk-arrival/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import User from "@/src/models/User";
import { requireRole } from "@/src/lib/auth/middleware";

export async function POST(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const { attendeeIds, method = "bulk" } = body;
    const user = (request as any).user;

    if (!attendeeIds || !Array.isArray(attendeeIds) || attendeeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Attendee IDs are required" },
        { status: 400 }
      );
    }

    // Get staff user
    const staffUser = await User.findOne({ user_id: user.user_id });
    if (!staffUser) {
      return NextResponse.json(
        { success: false, error: "Staff user not found" },
        { status: 404 }
      );
    }

    // Get attendees that haven't arrived
    const attendees = await Attendee.find({
      _id: { $in: attendeeIds },
      arrived: false
    });

    if (attendees.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All attendees have already arrived",
        data: { processed: 0 }
      });
    }

    // Process each attendee
    const results = [];
    for (const attendee of attendees) {
      attendee.arrived = true;
      attendee.arrival_time = new Date();
      attendee.arrival_checked_by = staffUser._id;
      attendee.arrival_method = method;
      
      // ✅ Removed badge references
      
      await attendee.save();

      results.push({
        _id: attendee._id,
        unique_id: attendee.unique_id,
        first_name: attendee.first_name,
        last_name: attendee.last_name,
        full_name: `${attendee.first_name} ${attendee.last_name}`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully checked in ${results.length} attendees`,
      data: {
        processed: results.length,
        attendees: results,
      }
    });
  } catch (error) {
    console.error("Bulk arrival error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to process bulk arrival",
        message: error instanceof Error ? error.message : "Something went wrong"
      },
      { status: 500 }
    );
  }
}