// src/app/api/groups/reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import Group from "@/src/models/Group";
import { requireRole } from "@/src/lib/auth/middleware";

export async function POST(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const { confirm = false } = body;

    // Safety check - require confirmation
    if (!confirm) {
      return NextResponse.json({
        success: false,
        error: "Confirmation required",
        message: "Please set confirm: true to reset all group assignments. This action cannot be undone!",
        warning: "This will remove ALL group assignments from attendees and clear all group members.",
      }, { status: 400 });
    }

    console.log("🔄 Resetting all group assignments...");

    // ==================== GET STATS BEFORE RESET ====================
    const beforeStats = {
      totalAttendees: await Attendee.countDocuments(),
      assignedAttendees: await Attendee.countDocuments({ group_id: { $ne: null } }),
      unassignedAttendees: await Attendee.countDocuments({ group_id: null }),
      totalGroups: await Group.countDocuments({ is_active: true }),
      groupsWithMembers: await Group.countDocuments({ current_size: { $gt: 0 } }),
      totalMembers: await Group.aggregate([
        { $group: { _id: null, total: { $sum: "$current_size" } } }
      ]).then(r => r[0]?.total || 0),
    };

    console.log(`📊 Before reset:`, beforeStats);

    // ==================== RESET ALL GROUPS ====================
    // Clear members from all groups
    const resetGroups = await Group.updateMany(
      {},
      {
        $set: {
          members: [],
          current_size: 0,
          region_distribution: [],
        },
        $unset: {
          // Keep points, but reset if needed
        },
      }
    );
    console.log(`🏠 Reset ${resetGroups.modifiedCount} groups`);

    // ==================== RESET ALL ATTENDEES ====================
    // Remove group_id from all attendees
    const resetAttendees = await Attendee.updateMany(
      {},
      {
        $set: {
          group_id: null,
        },
      }
    );
    console.log(`👤 Reset ${resetAttendees.modifiedCount} attendees`);

    // ==================== GET STATS AFTER RESET ====================
    const afterStats = {
      totalAttendees: await Attendee.countDocuments(),
      assignedAttendees: await Attendee.countDocuments({ group_id: { $ne: null } }),
      unassignedAttendees: await Attendee.countDocuments({ group_id: null }),
      totalGroups: await Group.countDocuments({ is_active: true }),
      groupsWithMembers: await Group.countDocuments({ current_size: { $gt: 0 } }),
      totalMembers: await Group.aggregate([
        { $group: { _id: null, total: { $sum: "$current_size" } } }
      ]).then(r => r[0]?.total || 0),
    };

    console.log(`📊 After reset:`, afterStats);

    return NextResponse.json({
      success: true,
      message: "All group assignments have been reset successfully",
      data: {
        before: beforeStats,
        after: afterStats,
        changes: {
          attendees_reset: resetAttendees.modifiedCount,
          groups_cleared: resetGroups.modifiedCount,
          members_removed: beforeStats.totalMembers,
        },
      },
    });
  } catch (error) {
    console.error("Reset groups error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reset group assignments",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// GET - Check current group status (preview before reset)
export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const totalAttendees = await Attendee.countDocuments();
    const assignedAttendees = await Attendee.countDocuments({
      group_id: { $ne: null }
    });
    const unassignedAttendees = totalAttendees - assignedAttendees;

    const totalGroups = await Group.countDocuments({ is_active: true });
    const groupsWithMembers = await Group.countDocuments({ current_size: { $gt: 0 } });
    
    const totalMembers = await Group.aggregate([
      { $group: { _id: null, total: { $sum: "$current_size" } } }
    ]).then(r => r[0]?.total || 0);

    // Get group distribution
    const groupDistribution = await Group.aggregate([
      { $match: { is_active: true } },
      {
        $group: {
          _id: '$current_size',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get groups with most members
    const topGroups = await Group.find({ is_active: true })
      .sort({ current_size: -1 })
      .limit(5)
      .select('name group_code current_size max_size')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        attendees: {
          total: totalAttendees,
          assigned: assignedAttendees,
          unassigned: unassignedAttendees,
          assignment_rate: totalAttendees > 0 ? Number(((assignedAttendees / totalAttendees) * 100).toFixed(1)) : 0,
        },
        groups: {
          total: totalGroups,
          with_members: groupsWithMembers,
          empty: totalGroups - groupsWithMembers,
          total_members: totalMembers,
        },
        distribution: groupDistribution,
        top_groups: topGroups,
        reset_ready: true,
        warning: "Resetting will remove ALL group assignments from attendees. Use POST with { confirm: true } to proceed.",
      },
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get group status",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}