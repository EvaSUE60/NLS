// src/app/api/groups/[id]/remove/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Group, { IGroupMember } from "@/src/models/Group";
import Attendee from "@/src/models/Attendee";
import { requireRole } from "@/src/lib/auth/middleware";
import mongoose from "mongoose";

// ✅ Define RegionDistribution type locally
interface IRegionDistribution {
  region: string;
  count: number;
}

// POST - Remove attendee from group by NLS ID or attendee ID
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
    // ✅ Support both nls_id and attendee_id
    const { nls_id, attendee_id } = body;

    if (!nls_id && !attendee_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing identifier",
          message: "Either nls_id or attendee_id is required" 
        },
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

    // Find attendee by NLS ID or attendee ID
    let attendee = null;
    if (nls_id) {
      attendee = await Attendee.findOne({ unique_id: nls_id });
    } else if (attendee_id) {
      attendee = await Attendee.findById(attendee_id);
    }

    if (!attendee) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Attendee not found",
          message: `No attendee found with provided identifier`
        },
        { status: 404 }
      );
    }

    // Find member in group
    const memberIndex = group.members.findIndex(
      (m: IGroupMember) => m.attendeeId.toString() === attendee._id.toString()
    );

    if (memberIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Not in group",
          message: `${attendee.first_name} ${attendee.last_name} is not in group "${group.name}"`,
        },
        { status: 400 }
      );
    }

    // Remove member from group
    const removedMember = group.members[memberIndex];
    group.members.splice(memberIndex, 1);

    // ✅ Update region distribution with local interface
    const regionDistribution: IRegionDistribution[] = group.region_distribution || [];
    const regionEntry = regionDistribution.find(
      (r: IRegionDistribution) => r.region === removedMember.region
    );
    if (regionEntry) {
      regionEntry.count -= 1;
      if (regionEntry.count <= 0) {
        group.region_distribution = group.region_distribution.filter(
          (r: IRegionDistribution) => r.region !== removedMember.region
        );
      }
    }

    group.current_size = group.members.length;
    await group.save();

    // Update attendee
    attendee.group_id = null;
    await attendee.save();

    return NextResponse.json({
      success: true,
      message: `${attendee.first_name} ${attendee.last_name} removed from group "${group.name}"`,
      data: {
        group: {
          _id: group._id,
          name: group.name,
          group_code: group.group_code,
          member_count: group.members.length,
          max_size: group.max_size,
          current_size: group.current_size,
        },
        attendee: {
          _id: attendee._id,
          unique_id: attendee.unique_id,
          full_name: `${attendee.first_name} ${attendee.last_name}`,
          region: attendee.region,
        },
      },
    });
  } catch (error) {
    console.error("Remove from group error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to remove attendee from group",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}