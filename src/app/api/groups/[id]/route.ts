// src/app/api/groups/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Group from "@/src/models/Group";
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
        { success: false, error: "Invalid group ID" },
        { status: 400 }
      );
    }

    const group = await Group.findById(id).lean();

    if (!group) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    const memberCount = group.members.length;

    return NextResponse.json({
      success: true,
      data: {
        ...group,
        member_count: memberCount,
        available_slots: group.max_size - memberCount,
        is_full: memberCount >= group.max_size,
      },
    });
  } catch (error) {
    console.error("Get group error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch group",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// PUT - Update group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid group ID" },
        { status: 400 }
      );
    }

    // Check if updating name that already exists
    if (body.name) {
      const existing = await Group.findOne({
        name: body.name,
        _id: { $ne: id },
      });
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: "Group exists",
            message: `Group with name "${body.name}" already exists`,
          },
          { status: 409 }
        );
      }
    }

    const group = await Group.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!group) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Group updated successfully",
      data: group,
    });
  } catch (error) {
    console.error("Update group error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update group",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid group ID" },
        { status: 400 }
      );
    }

    const group = await Group.findById(id);
    if (!group) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    // Check if group has members
    if (group.members.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete group with members",
          message: `Group has ${group.members.length} members. Remove them first.`,
        },
        { status: 400 }
      );
    }

    await Group.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Group "${group.name}" deleted successfully`,
      data: {
        group_id: group.group_id,
        name: group.name,
      },
    });
  } catch (error) {
    console.error("Delete group error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete group",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}