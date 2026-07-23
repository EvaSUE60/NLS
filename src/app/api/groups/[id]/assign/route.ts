// src/app/api/groups/[id]/assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Group, { IGroupMember } from "@/src/models/Group";
import Attendee from "@/src/models/Attendee";
import { requireRole } from "@/src/lib/auth/middleware";
import mongoose from "mongoose";

// ✅ Define RegionDistribution type
interface IRegionDistribution {
  region: string;
  count: number;
}

// POST - Assign attendee to group (manual) by NLS ID
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { nls_id } = body;

    if (!nls_id) {
      return NextResponse.json(
        { success: false, error: "NLS ID is required (e.g., NLS-2026-002)" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid group ID" },
        { status: 400 }
      );
    }

    // Get group
    const group = await Group.findById(id);
    if (!group) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    // Check if group is full
    if (group.members.length >= group.max_size) {
      return NextResponse.json(
        {
          success: false,
          error: "Group is full",
          message: `Group "${group.name}" has reached max capacity (${group.max_size})`,
        },
        { status: 400 }
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

    // Check if attendee already has a group
    if (attendee.group_id) {
      const existingGroup = await Group.findById(attendee.group_id);
      return NextResponse.json(
        {
          success: false,
          error: "Already in group",
          message: `Attendee is already in group "${existingGroup?.name}"`,
          data: { group_id: existingGroup?.group_id, group_name: existingGroup?.name },
        },
        { status: 400 }
      );
    }

    // Check if attendee already in this group
    const exists = group.members.some(
      (m: IGroupMember) => m.unique_id === attendee.unique_id
    );
    if (exists) {
      return NextResponse.json(
        {
          success: false,
          error: "Already in group",
          message: `Attendee is already in group "${group.name}"`,
        },
        { status: 400 }
      );
    }

    // ✅ Check region limit (max 2 per region) - with proper typing
    const regionDistribution: IRegionDistribution[] = group.region_distribution || [];
    const regionEntry = regionDistribution.find(
      (r: IRegionDistribution) => r.region === attendee.region
    );
    const regionCount = regionEntry?.count || 0;

    if (regionCount >= 2) {
      return NextResponse.json(
        {
          success: false,
          error: "Region limit exceeded",
          message: `Group already has 2 members from region "${attendee.region}" (max 2 per region)`,
        },
        { status: 400 }
      );
    }

    // Add member to group
    group.members.push({
      attendeeId: attendee._id,
      unique_id: attendee.unique_id,
      fullName: `${attendee.first_name} ${attendee.last_name}`,
      region: attendee.region,
      joinedAt: new Date(),
    });

    if (regionEntry) {
      regionEntry.count += 1;
    } else {
      group.region_distribution.push({ region: attendee.region, count: 1 });
    }

    group.current_size = group.members.length;
    await group.save();

    // Update attendee
    attendee.group_id = group._id;
    await attendee.save();

    return NextResponse.json({
      success: true,
      message: `${attendee.first_name} ${attendee.last_name} (${attendee.unique_id}) assigned to group "${group.name}"`,
      data: {
        group: {
          _id: group._id,
          name: group.name,
          group_code: group.group_code,
          member_count: group.members.length,
          max_size: group.max_size,
        },
        attendee: {
          _id: attendee._id,
          unique_id: attendee.unique_id,
          full_name: `${attendee.first_name} ${attendee.last_name}`,
        },
      },
    });
  } catch (error) {
    console.error("Assign to group error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to assign attendee to group",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}