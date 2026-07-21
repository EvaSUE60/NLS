// src/app/api/dorm/reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import Room from "@/src/models/Room";
import Building from "@/src/models/Building";
import DormAssignment from "@/src/models/DormAssignment";
import { requireRole } from "@/src/lib/auth/middleware";

export async function POST(request: NextRequest) {
  try {
    // Only super_admin can reset all dorm assignments
    const authError = await requireRole(["super_admin"])(request);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const { confirm = false } = body;

    // Safety check - require confirmation
    if (!confirm) {
      return NextResponse.json({
        success: false,
        error: "Confirmation required",
        message: "Please set confirm: true to reset all dorm assignments. This action cannot be undone!",
        warning: "This will remove ALL dorm assignments and reset ALL rooms.",
      }, { status: 400 });
    }

    console.log("🔄 Resetting all dorm assignments...");

    // 1. Get counts before reset
    const beforeStats = {
      assignments: await DormAssignment.countDocuments({ status: "active" }),
      assignedAttendees: await Attendee.countDocuments({ dorm_assignment_id: { $ne: null } }),
      occupiedRooms: await Room.countDocuments({ current_occupancy: { $gt: 0 } }),
      occupiedBeds: await Room.aggregate([
        { $group: { _id: null, total: { $sum: "$current_occupancy" } } }
      ]).then(r => r[0]?.total || 0),
    };

    console.log(`📊 Before reset:`, beforeStats);

    // 2. Delete all dorm assignments
    const deletedAssignments = await DormAssignment.deleteMany({});
    console.log(`🗑️ Deleted ${deletedAssignments.deletedCount} assignments`);

    // 3. Reset all attendees - remove dorm references
    const resetAttendees = await Attendee.updateMany(
      {},
      {
        $set: {
          dorm_assignment_id: null,
          dorm_cache: {
            roomNumber: null,
            bedNumber: null,
            floor: null,
            buildingType: null,
            buildingName: null,
          },
        },
      }
    );
    console.log(`👤 Reset ${resetAttendees.modifiedCount} attendees`);

    // 4. Reset all rooms - clear occupants and occupancy
    const resetRooms = await Room.updateMany(
      {},
      {
        $set: {
          occupants: [],
          current_occupancy: 0,
          is_full: false,
          check_in_status: "empty",
        },
      }
    );
    console.log(`🏠 Reset ${resetRooms.modifiedCount} rooms`);

    // 5. Reset all buildings - reset occupancy stats
    const resetBuildings = await Building.updateMany(
      {},
      {
        $set: {
          occupied_rooms: 0,
          current_occupancy: 0,
        },
      }
    );
    console.log(`🏗️ Reset ${resetBuildings.modifiedCount} buildings`);

    // 6. Get counts after reset
    const afterStats = {
      assignments: await DormAssignment.countDocuments({ status: "active" }),
      assignedAttendees: await Attendee.countDocuments({ dorm_assignment_id: { $ne: null } }),
      occupiedRooms: await Room.countDocuments({ current_occupancy: { $gt: 0 } }),
      occupiedBeds: await Room.aggregate([
        { $group: { _id: null, total: { $sum: "$current_occupancy" } } }
      ]).then(r => r[0]?.total || 0),
    };

    console.log(`📊 After reset:`, afterStats);

    return NextResponse.json({
      success: true,
      message: "All dorm assignments have been reset successfully",
      data: {
        before: beforeStats,
        after: afterStats,
        changes: {
          assignments_deleted: deletedAssignments.deletedCount,
          attendees_reset: resetAttendees.modifiedCount,
          rooms_reset: resetRooms.modifiedCount,
          buildings_reset: resetBuildings.modifiedCount,
        },
      },
    });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reset dorm assignments",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// GET - Check current dorm status (preview before reset)
export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const totalAttendees = await Attendee.countDocuments();
    const assignedAttendees = await Attendee.countDocuments({
      dorm_assignment_id: { $ne: null }
    });
    const unassignedAttendees = totalAttendees - assignedAttendees;

    const totalAssignments = await DormAssignment.countDocuments({ status: "active" });
    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Room.countDocuments({ current_occupancy: { $gt: 0 } });
    
    const totalBeds = await Room.aggregate([
      { $group: { _id: null, total: { $sum: "$capacity" } } }
    ]).then(r => r[0]?.total || 0);
    
    const occupiedBeds = await Room.aggregate([
      { $group: { _id: null, total: { $sum: "$current_occupancy" } } }
    ]).then(r => r[0]?.total || 0);

    return NextResponse.json({
      success: true,
      data: {
        attendees: {
          total: totalAttendees,
          assigned: assignedAttendees,
          unassigned: unassignedAttendees,
          assignment_rate: totalAttendees > 0 ? ((assignedAttendees / totalAttendees) * 100).toFixed(1) : 0,
        },
        assignments: {
          total: totalAssignments,
        },
        rooms: {
          total: totalRooms,
          occupied: occupiedRooms,
          available: totalRooms - occupiedRooms,
        },
        beds: {
          total: totalBeds,
          occupied: occupiedBeds,
          available: totalBeds - occupiedBeds,
        },
        reset_ready: true,
        warning: "Resetting will remove ALL dorm assignments. Use POST with { confirm: true } to proceed.",
      },
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get dorm status",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}