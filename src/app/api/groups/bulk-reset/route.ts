// src/app/api/groups/bulk-reset/route.ts
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
    const { confirm = false, groupIds = [], deleteAll = false } = body;

    // Safety check - require confirmation
    if (!confirm) {
      return NextResponse.json({
        success: false,
        error: "Confirmation required",
        message: "Please set confirm: true to delete groups. This action cannot be undone!",
        warning: "This will permanently delete groups and remove assignments from attendees.",
      }, { status: 400 });
    }

    console.log("🗑️ Deleting groups...");

    // ==================== GET STATS BEFORE DELETE ====================
    let query = {};
    if (!deleteAll && groupIds.length > 0) {
      query = { _id: { $in: groupIds } };
    }

    const groupsToDelete = await Group.find(query);
    const groupIdsToDelete = groupsToDelete.map(g => g._id);
    const groupNames = groupsToDelete.map(g => g.name);

    const beforeStats = {
      totalGroups: await Group.countDocuments(),
      groupsToDelete: groupsToDelete.length,
      totalAttendees: await Attendee.countDocuments(),
      assignedAttendees: await Attendee.countDocuments({ 
        group_id: { $in: groupIdsToDelete } 
      }),
      totalMembers: await Group.aggregate([
        { $match: { _id: { $in: groupIdsToDelete } } },
        { $group: { _id: null, total: { $sum: "$current_size" } } }
      ]).then(r => r[0]?.total || 0),
    };

    console.log(`📊 Before delete:`, beforeStats);

    // ==================== REMOVE GROUP_ID FROM ATTENDEES ====================
    if (groupIdsToDelete.length > 0) {
      const resetAttendees = await Attendee.updateMany(
        { group_id: { $in: groupIdsToDelete } },
        { $set: { group_id: null } }
      );
      console.log(`👤 Removed group_id from ${resetAttendees.modifiedCount} attendees`);
    }

    // ==================== DELETE GROUPS ====================
    const deletedGroups = await Group.deleteMany(query);
    console.log(`🗑️ Deleted ${deletedGroups.deletedCount} groups`);

    // ==================== GET STATS AFTER DELETE ====================
    const afterStats = {
      totalGroups: await Group.countDocuments(),
      totalAttendees: await Attendee.countDocuments(),
      assignedAttendees: await Attendee.countDocuments({ group_id: { $ne: null } }),
    };

    console.log(`📊 After delete:`, afterStats);

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedGroups.deletedCount} groups successfully`,
      data: {
        deleted_groups: groupNames,
        deleted_count: deletedGroups.deletedCount,
        before: beforeStats,
        after: afterStats,
        changes: {
          groups_deleted: deletedGroups.deletedCount,
          attendees_reset: beforeStats.assignedAttendees,
          members_removed: beforeStats.totalMembers,
        },
      },
    });
  } catch (error) {
    console.error("Bulk delete groups error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete groups",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// GET - Preview groups that would be deleted
export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const deleteAll = searchParams.get('deleteAll') === 'true';
    const groupIds = searchParams.get('groupIds')?.split(',') || [];

    let query = {};
    if (!deleteAll && groupIds.length > 0) {
      query = { _id: { $in: groupIds } };
    }

    const groups = await Group.find(query)
      .sort({ name: 1 })
      .lean();

    const groupIdsList = groups.map(g => g._id);
    
    const assignedCount = await Attendee.countDocuments({
      group_id: { $in: groupIdsList }
    });

    const totalMembers = await Group.aggregate([
      { $match: { _id: { $in: groupIdsList } } },
      { $group: { _id: null, total: { $sum: "$current_size" } } }
    ]).then(r => r[0]?.total || 0);

    const totalGroups = await Group.countDocuments();

    return NextResponse.json({
      success: true,
      data: {
        groups: groups.map(g => ({
          _id: g._id,
          name: g.name,
          group_code: g.group_code,
          member_count: g.members.length,
          max_size: g.max_size,
          current_size: g.current_size,
        })),
        summary: {
          total_groups: totalGroups,
          groups_to_delete: groups.length,
          attendees_affected: assignedCount,
          members_affected: totalMembers,
        },
        warning: "Deleting these groups will remove assignments from attendees. Use POST with { confirm: true } to proceed.",
      },
    });
  } catch (error) {
    console.error("Groups preview error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get groups preview",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}