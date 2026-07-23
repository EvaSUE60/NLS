// src/app/api/groups/[id]/points/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Group, { IGroupActivity } from "@/src/models/Group"; // ✅ Import IGroupActivity
import User from "@/src/models/User";
import { requireRole } from "@/src/lib/auth/middleware";
import mongoose from "mongoose";
import { generateId } from "@/src/lib/generateId";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Only super_admin and admin can add points
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { type, points, reason } = body;

    if (!type || points === undefined || !reason) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing fields",
          message: "type, points, and reason are required",
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

    const group = await Group.findById(id);
    if (!group) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    // Get admin user
    const user = (request as any).user;
    const adminUser = await User.findOne({ user_id: user.user_id });

    // Update points
    const pointsChange = type === "bonus" ? Math.abs(points) : -Math.abs(points);
    group.points += pointsChange;

    if (type === "bonus") {
      group.total_earned += Math.abs(points);
    } else {
      group.total_lost += Math.abs(points);
    }

    // Add activity
    group.activities.push({
      activity_id: await generateId('ACT'),
      type: type === "bonus" ? "bonus" : "penalty",
      description: reason,
      points: pointsChange,
      reason,
      created_by: adminUser?._id,
      created_at: new Date(),
    });

    await group.save();

    return NextResponse.json({
      success: true,
      message: `${type === "bonus" ? "Bonus" : "Penalty"} applied to group "${group.name}"`,
      data: {
        group: {
          _id: group._id,
          name: group.name,
          points: group.points,
          total_earned: group.total_earned,
          total_lost: group.total_lost,
        },
        activity: {
          type: type === "bonus" ? "bonus" : "penalty",
          points: pointsChange,
          reason: reason,
          created_by: adminUser?.name || "System",
          created_at: new Date(),
        },
        recent_activities: group.activities.slice(-5).reverse(),
      },
    });
  } catch (error) {
    console.error("Update group points error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update group points",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// GET - Get group activities
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

    const group = await Group.findById(id);
    if (!group) {
      return NextResponse.json(
        { success: false, error: "Group not found" },
        { status: 404 }
      );
    }

    // ✅ Sort activities with proper typing
    const sortedActivities = [...group.activities].sort(
      (a: IGroupActivity, b: IGroupActivity) => 
        b.created_at.getTime() - a.created_at.getTime()
    );

    // ✅ Filter with proper typing
    const bonuses = group.activities.filter(
      (a: IGroupActivity) => a.type === "bonus"
    ).length;
    
    const penalties = group.activities.filter(
      (a: IGroupActivity) => a.type === "penalty" || a.type === "auto_penalty"
    ).length;

    return NextResponse.json({
      success: true,
      data: {
        group: {
          _id: group._id,
          name: group.name,
          points: group.points,
          total_earned: group.total_earned,
          total_lost: group.total_lost,
        },
        activities: sortedActivities,
        summary: {
          total_activities: group.activities.length,
          bonuses: bonuses,
          penalties: penalties,
        },
      },
    });
  } catch (error) {
    console.error("Get group activities error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get group activities",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}