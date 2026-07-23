// src/app/api/attendees/[id]/group/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Group from "@/src/models/Group";
import Attendee from "@/src/models/Attendee";
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

    if (!attendee.group_id) {
      return NextResponse.json({
        success: true,
        message: "Attendee is not assigned to any group",
        data: { attendee: null },
      });
    }

    const group = await Group.findById(attendee.group_id);

    return NextResponse.json({
      success: true,
      data: {
        attendee: {
          _id: attendee._id,
          unique_id: attendee.unique_id,
          full_name: `${attendee.first_name} ${attendee.last_name}`,
        },
        group: group ? {
          _id: group._id,
          group_id: group.group_id,
          name: group.name,
          group_code: group.group_code,
          member_count: group.members.length,
          max_size: group.max_size,
          points: group.points,
          region_distribution: group.region_distribution,
        } : null,
      },
    });
  } catch (error) {
    console.error("Get attendee group error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get attendee group",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}