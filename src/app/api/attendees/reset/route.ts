// src/app/api/attendees/reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import Building from "@/src/models/Building";
import Room from "@/src/models/Room";
import DormAssignment from "@/src/models/DormAssignment";
import { requireRole } from "@/src/lib/auth/middleware";

export async function POST(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const { confirm = false, type = "all" } = body;

    // Safety check - require confirmation
    if (!confirm) {
      return NextResponse.json(
        {
          success: false,
          error: "Confirmation required",
          message: "Please set confirm: true to proceed with reset. This action cannot be undone.",
        },
        { status: 400 }
      );
    }

    console.log("🔄 Starting full reset of attendee arrivals and assignments...");

    // ==================== GET STATS BEFORE RESET ====================
    const totalAttendees = await Attendee.countDocuments();
    const arrivedAttendees = await Attendee.countDocuments({ arrived: true });
    const assignedAttendees = await Attendee.countDocuments({
      dorm_assignment_id: { $ne: null }
    });
    const totalAssignments = await DormAssignment.countDocuments({ status: "active" });

    console.log(`📊 Before reset:`);
    console.log(`   - Total attendees: ${totalAttendees}`);
    console.log(`   - Arrived: ${arrivedAttendees}`);
    console.log(`   - Assigned: ${assignedAttendees}`);
    console.log(`   - Active assignments: ${totalAssignments}`);

    // ==================== RESET ATTENDEES ====================
    // Reset all attendees - clear arrival and dorm assignment
    const resetResult = await Attendee.updateMany(
      {},
      {
        $set: {
          arrived: false,
          arrival_time: null,
          arrival_checked_by: null,
          arrival_method: null,
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

    console.log(`✅ Reset ${resetResult.modifiedCount} attendees`);

    // ==================== DELETE ALL ASSIGNMENTS ====================
    const deleteResult = await DormAssignment.deleteMany({ status: "active" });
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} dorm assignments`);

    // ==================== RESET ROOMS ====================
    const roomResetResult = await Room.updateMany(
      {},
      {
        $set: {
          current_occupancy: 0,
          is_full: false,
          check_in_status: "empty",
        },
        $setOnInsert: {
          occupants: [],
        },
      }
    );
    console.log(`✅ Reset ${roomResetResult.modifiedCount} rooms`);

    // ==================== RESET BUILDINGS ====================
    const buildingResetResult = await Building.updateMany(
      {},
      {
        $set: {
          current_occupancy: 0,
          occupied_rooms: 0,
        },
      }
    );
    console.log(`✅ Reset ${buildingResetResult.modifiedCount} buildings`);

    // ==================== GET STATS AFTER RESET ====================
    const afterTotalAttendees = await Attendee.countDocuments();
    const afterArrivedAttendees = await Attendee.countDocuments({ arrived: true });
    const afterAssignedAttendees = await Attendee.countDocuments({
      dorm_assignment_id: { $ne: null }
    });
    const afterTotalAssignments = await DormAssignment.countDocuments({ status: "active" });

    console.log(`📊 After reset:`);
    console.log(`   - Total attendees: ${afterTotalAttendees}`);
    console.log(`   - Arrived: ${afterArrivedAttendees}`);
    console.log(`   - Assigned: ${afterAssignedAttendees}`);
    console.log(`   - Active assignments: ${afterTotalAssignments}`);

    return NextResponse.json({
      success: true,
      message: "All attendees, assignments, rooms, and buildings have been reset successfully",
      data: {
        before: {
          total_attendees: totalAttendees,
          arrived: arrivedAttendees,
          assigned: assignedAttendees,
          active_assignments: totalAssignments,
        },
        after: {
          total_attendees: afterTotalAttendees,
          arrived: afterArrivedAttendees,
          assigned: afterAssignedAttendees,
          active_assignments: afterTotalAssignments,
        },
        changes: {
          attendees_reset: resetResult.modifiedCount,
          assignments_deleted: deleteResult.deletedCount,
          rooms_reset: roomResetResult.modifiedCount,
          buildings_reset: buildingResetResult.modifiedCount,
        },
      },
    });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reset",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}