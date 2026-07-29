// src/app/api/groups/[id]/points/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Group, { IGroupActivity } from "@/src/models/Group";
import User from "@/src/models/User";
import { requireRole } from "@/src/lib/auth/middleware";
import mongoose from "mongoose";
import { generateId } from "@/src/lib/generateId";

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
    const { type, points, reason } = body;

    // ✅ Better validation with more specific error messages
    if (!type) {
      return NextResponse.json(
        { success: false, error: "Type is required (bonus or penalty)" },
        { status: 400 }
      );
    }

    if (type !== "bonus" && type !== "penalty") {
      return NextResponse.json(
        { success: false, error: "Type must be 'bonus' or 'penalty'" },
        { status: 400 }
      );
    }

    if (points === undefined || points === null) {
      return NextResponse.json(
        { success: false, error: "Points are required" },
        { status: 400 }
      );
    }

    if (points < 1) {
      return NextResponse.json(
        { success: false, error: "Points must be at least 1" },
        { status: 400 }
      );
    }

    if (points > 50) {
      return NextResponse.json(
        { success: false, error: "Points cannot exceed 50" },
        { status: 400 }
      );
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { success: false, error: "Reason is required" },
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

    // ✅ Calculate points change
    const absolutePoints = Math.abs(points);
    const pointsChange = type === "bonus" ? absolutePoints : -absolutePoints;
    
    // ✅ Store previous points for logging
    const previousPoints = group.points;
    group.points += pointsChange;

    if (type === "bonus") {
      group.total_earned += absolutePoints;
    } else {
      group.total_lost += absolutePoints;
    }

    // ✅ Add activity with more details
    const activity: IGroupActivity = {
      activity_id: await generateId('ACT'),
      type: type === "bonus" ? "bonus" : "penalty",
      description: reason.trim(),
      points: pointsChange,
      reason: reason.trim(),
      created_by: adminUser?._id,
      created_at: new Date(),
    };
    
    group.activities.push(activity);
    await group.save();

    // ✅ Log the change
    console.log(`📊 Points updated for ${group.name}: ${previousPoints} → ${group.points} (${type === 'bonus' ? '+' : ''}${pointsChange})`);

    // ✅ Get recent activities (last 10)
    const recentActivities = [...group.activities]
      .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())
      .slice(0, 10)
      .map((a) => ({
        ...a,
        created_at: a.created_at.toISOString(),
      }));

    return NextResponse.json({
      success: true,
      message: `${type === "bonus" ? "🎉 Bonus" : "⚠️ Penalty"} applied to group "${group.name}"`,
      data: {
        group: {
          _id: group._id,
          name: group.name,
          points: group.points,
          total_earned: group.total_earned,
          total_lost: group.total_lost,
          points_change: pointsChange,
          previous_points: previousPoints,
        },
        activity: {
          type: type === "bonus" ? "bonus" : "penalty",
          points: pointsChange,
          reason: reason.trim(),
          created_by: adminUser?.name || "System",
          created_at: new Date().toISOString(),
        },
        recent_activities: recentActivities,
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

    // ✅ Get query params for filtering
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type'); // 'bonus' | 'penalty' | 'all'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // ✅ Filter activities
    let activities = [...group.activities];

    if (type && type !== 'all') {
      activities = activities.filter((a: IGroupActivity) => a.type === type);
    }

    if (startDate) {
      const start = new Date(startDate);
      activities = activities.filter((a: IGroupActivity) => a.created_at >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      activities = activities.filter((a: IGroupActivity) => a.created_at <= end);
    }

    // ✅ Sort by most recent
    activities = activities.sort(
      (a: IGroupActivity, b: IGroupActivity) => 
        b.created_at.getTime() - a.created_at.getTime()
    );

    // ✅ Apply limit
    const limitedActivities = activities.slice(0, limit);

    // ✅ Calculate summary statistics with proper typing
    const totalBonuses = group.activities.filter((a: IGroupActivity) => a.type === "bonus").length;
    const totalPenalties = group.activities.filter(
      (a: IGroupActivity) => a.type === "penalty" || a.type === "auto_penalty"
    ).length;
    
    // ✅ Fix: Add type annotations to reduce parameters
    const totalBonusPoints = group.activities
      .filter((a: IGroupActivity) => a.type === "bonus")
      .reduce((sum: number, a: IGroupActivity) => sum + a.points, 0);
    
    const totalPenaltyPoints = group.activities
      .filter((a: IGroupActivity) => a.type === "penalty" || a.type === "auto_penalty")
      .reduce((sum: number, a: IGroupActivity) => sum + Math.abs(a.points), 0);

    // ✅ Group activities by date for chart with proper typing
    const activitiesByDate = group.activities.reduce((acc: Record<string, number>, a: IGroupActivity) => {
      const date = a.created_at.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + a.points;
      return acc;
    }, {});

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
        activities: limitedActivities.map((a) => ({
          ...a,
          created_at: a.created_at.toISOString(),
        })),
        summary: {
          total_activities: group.activities.length,
          bonuses: totalBonuses,
          penalties: totalPenalties,
          total_bonus_points: totalBonusPoints,
          total_penalty_points: totalPenaltyPoints,
        },
        activities_by_date: activitiesByDate,
        pagination: {
          total: group.activities.length,
          limit: limit,
          returned: limitedActivities.length,
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