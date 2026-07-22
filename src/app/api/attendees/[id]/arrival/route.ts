// src/app/api/attendees/[id]/arrival/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import User from "@/src/models/User";
import { requireRole } from "@/src/lib/auth/middleware";

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
    const { method = "manual" } = body;
    const user = (request as any).user;

    console.log(`🔍 Checking in attendee: ${id}`);

    // Check if attendee exists
    const attendee = await Attendee.findById(id);
    if (!attendee) {
      console.log(`❌ Attendee not found: ${id}`);
      return NextResponse.json(
        { 
          success: false, 
          error: "Attendee not found",
          message: `No attendee found with ID: ${id}`
        },
        { status: 404 }
      );
    }

    console.log(`👤 Found attendee: ${attendee.first_name} ${attendee.last_name} (${attendee.unique_id})`);

    // Check if already arrived
    if (attendee.arrived) {
      console.log(`⚠️ Already arrived: ${attendee.first_name} ${attendee.last_name}`);
      return NextResponse.json({
        success: false,
        error: "Already arrived",
        message: `${attendee.first_name} ${attendee.last_name} has already arrived at ${attendee.arrival_time}`,
        data: {
          arrival_time: attendee.arrival_time,
          arrival_method: attendee.arrival_method,
        }
      }, { status: 400 });
    }

    // Get the staff user
    const staffUser = await User.findOne({ user_id: user.user_id });
    if (!staffUser) {
      console.log(`❌ Staff user not found: ${user.user_id}`);
      return NextResponse.json(
        { 
          success: false, 
          error: "Staff user not found",
          message: `No staff user found with ID: ${user.user_id}`
        },
        { status: 404 }
      );
    }

    // ✅ Update attendee - ARRIVAL CHECK-IN (removed badge references)
    attendee.arrived = true;
    attendee.arrival_time = new Date();
    attendee.arrival_checked_by = staffUser._id;
    attendee.arrival_method = method;
    
    await attendee.save();

    console.log(`✅ Checked in: ${attendee.first_name} ${attendee.last_name}`);

    // Get the staff name for response
    const staffName = staffUser.name || staffUser.email;

    return NextResponse.json({
      success: true,
      message: `${attendee.first_name} ${attendee.last_name} checked in successfully`,
      data: {
        attendee: {
          _id: attendee._id,
          unique_id: attendee.unique_id,
          first_name: attendee.first_name,
          last_name: attendee.last_name,
          full_name: `${attendee.first_name} ${attendee.last_name}`,
          region: attendee.region,
          arrived: attendee.arrived,
          arrival_time: attendee.arrival_time,
          arrival_method: attendee.arrival_method,
          dorm_cache: attendee.dorm_cache,
        },
        checked_by: staffName,
      }
    });
  } catch (error) {
    console.error("Arrival check-in error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to check in attendee",
        message: error instanceof Error ? error.message : "Something went wrong"
      },
      { status: 500 }
    );
  }
}