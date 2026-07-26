// src/app/api/dorm/stats/route.ts - Updated to only include active buildings
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Building from "@/src/models/Building";
import Room from "@/src/models/Room";
import Attendee from "@/src/models/Attendee";
import DormAssignment from "@/src/models/DormAssignment";
import { requireRole } from "@/src/lib/auth/middleware";

export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    // ✅ Get all active building IDs first
    const activeBuildings = await Building.find({ is_active: true }).select('_id');
    const activeBuildingIds = activeBuildings.map(b => b._id);

    // ==================== BUILDING STATS ====================
    const totalBuildings = activeBuildings.length;
    const menBuildings = await Building.countDocuments({ type: "men", is_active: true });
    const womenBuildings = await Building.countDocuments({ type: "women", is_active: true });

    // Get detailed building stats - only for active buildings
    const buildingDetails = await Building.aggregate([
      { $match: { is_active: true } },
      {
        $lookup: {
          from: 'rooms',
          localField: '_id',
          foreignField: 'building_id',
          as: 'rooms',
        },
      },
      {
        $project: {
          building_id: 1,
          name: 1,
          type: 1,
          floors: 1,
          total_rooms: { $size: '$rooms' },
          occupied_rooms: {
            $size: {
              $filter: {
                input: '$rooms',
                as: 'room',
                cond: { $gt: ['$$room.current_occupancy', 0] }
              }
            }
          },
          total_beds: { $sum: '$rooms.capacity' },
          occupied_beds: { $sum: '$rooms.current_occupancy' },
          total_capacity: '$capacity',
        },
      },
    ]);

    // ==================== ROOM STATS - Only from active buildings ====================
    const rooms = await Room.find({ 
      is_active: true,
      building_id: { $in: activeBuildingIds }
    });
    
    const totalRooms = rooms.length;
    const availableRooms = rooms.filter(r => !r.is_full).length;
    const occupiedRooms = rooms.filter(r => r.is_full).length;
    const emptyRooms = rooms.filter(r => r.check_in_status === "empty").length;
    const partialRooms = rooms.filter(r => r.check_in_status === "partial").length;
    const fullRooms = rooms.filter(r => r.check_in_status === "full").length;

    // ==================== BED STATS ====================
    const totalBeds = rooms.reduce((sum, r) => sum + r.capacity, 0);
    const occupiedBeds = rooms.reduce((sum, r) => sum + r.current_occupancy, 0);
    const availableBeds = totalBeds - occupiedBeds;

    // Bed occupancy by building type
    const bedStatsByType = await Room.aggregate([
      { 
        $match: { 
          is_active: true,
          building_id: { $in: activeBuildingIds }
        } 
      },
      {
        $group: {
          _id: '$building_type',
          total_beds: { $sum: '$capacity' },
          occupied_beds: { $sum: '$current_occupancy' },
          rooms_count: { $sum: 1 },
        },
      },
    ]);

    // ==================== ASSIGNMENT STATS ====================
    const activeAssignments = await DormAssignment.countDocuments({ status: "active" });
    const cancelledAssignments = await DormAssignment.countDocuments({ status: "cancelled" });
    const changedAssignments = await DormAssignment.countDocuments({ status: "changed" });
    const totalAssignments = await DormAssignment.countDocuments();

    // Assignments by building - only active buildings
    const assignmentsByBuilding = await DormAssignment.aggregate([
      { $match: { status: "active" } },
      {
        $lookup: {
          from: 'buildings',
          localField: 'building_id',
          foreignField: '_id',
          as: 'building',
        },
      },
      { $unwind: '$building' },
      { $match: { 'building.is_active': true } },
      {
        $group: {
          _id: '$building_id',
          building_name: { $first: '$building.name' },
          building_type: { $first: '$building.type' },
          count: { $sum: 1 },
        },
      },
    ]);

    // ==================== ATTENDEE STATS ====================
    const totalAttendees = await Attendee.countDocuments();
    const assignedAttendees = await Attendee.countDocuments({ 
      dorm_assignment_id: { $ne: null } 
    });
    const unassignedAttendees = totalAttendees - assignedAttendees;

    // Attendees by gender with room assignment
    const attendeesByGender = await Attendee.aggregate([
      {
        $group: {
          _id: '$gender',
          total: { $sum: 1 },
          assigned: {
            $sum: {
              $cond: [{ $ne: ['$dorm_assignment_id', null] }, 1, 0]
            }
          },
          unassigned: {
            $sum: {
              $cond: [{ $eq: ['$dorm_assignment_id', null] }, 1, 0]
            }
          },
        },
      },
    ]);

    // Attendees by region
    const attendeesByRegion = await Attendee.aggregate([
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 },
          assigned: {
            $sum: {
              $cond: [{ $ne: ['$dorm_assignment_id', null] }, 1, 0]
            }
          },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // ==================== ROOM OCCUPANCY DISTRIBUTION ====================
    const occupancyDistribution = await Room.aggregate([
      { 
        $match: { 
          is_active: true,
          building_id: { $in: activeBuildingIds }
        } 
      },
      {
        $group: {
          _id: '$current_occupancy',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ==================== RECENT ACTIVITY ====================
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    const todayAssignments = await DormAssignment.countDocuments({
      assigned_at: { $gte: todayStart },
      status: "active",
    });

    const weekAssignments = await DormAssignment.countDocuments({
      assigned_at: { $gte: weekStart },
      status: "active",
    });

    // ==================== CALCULATE RATES ====================
    const bedOccupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
    const roomOccupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

    // ==================== RESPONSE ====================
    return NextResponse.json({
      success: true,
      data: {
        buildings: {
          total: totalBuildings,
          men: menBuildings,
          women: womenBuildings,
          details: buildingDetails,
        },
        rooms: {
          total: totalRooms,
          available: availableRooms,
          occupied: occupiedRooms,
          empty: emptyRooms,
          partial: partialRooms,
          full: fullRooms,
          occupancy_rate: Number(roomOccupancyRate.toFixed(1)),
          by_type: bedStatsByType,
        },
        beds: {
          total: totalBeds,
          occupied: occupiedBeds,
          available: availableBeds,
          occupancy_rate: Number(bedOccupancyRate.toFixed(1)),
        },
        assignments: {
          active: activeAssignments,
          cancelled: cancelledAssignments,
          changed: changedAssignments,
          total: totalAssignments,
          by_building: assignmentsByBuilding,
          recent: {
            today: todayAssignments,
            week: weekAssignments,
          },
        },
        attendees: {
          total: totalAttendees,
          assigned: assignedAttendees,
          unassigned: unassignedAttendees,
          assignment_rate: totalAttendees > 0 ? Number(((assignedAttendees / totalAttendees) * 100).toFixed(1)) : 0,
          by_gender: attendeesByGender,
          by_region: attendeesByRegion,
        },
        occupancy_distribution: occupancyDistribution,
      },
    });
  } catch (error) {
    console.error("Dorm stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dorm statistics",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}