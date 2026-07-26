// src/app/api/buildings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Building from "@/src/models/Building";
import Room from "@/src/models/Room";
import DormAssignment from "@/src/models/DormAssignment";
import Attendee from "@/src/models/Attendee";
import { requireRole } from "@/src/lib/auth/middleware";

// GET - Get single building with room details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    const building = await Building.findOne({ _id: id, is_active: true });
    if (!building) {
      return NextResponse.json(
        { success: false, error: "Building not found" },
        { status: 404 }
      );
    }

    // Get rooms by floor
    const rooms = await Room.find({ building_id: building._id, is_active: true })
      .populate('occupants', 'first_name last_name unique_id')
      .sort({ floor: 1, room_number: 1 });

    const roomsByFloor = rooms.reduce((acc: any, room) => {
      const floorKey = room.floor;
      if (!acc[floorKey]) {
        acc[floorKey] = {
          floor: floorKey,
          floor_name: room.floor_name,
          rooms: [],
        };
      }
      acc[floorKey].rooms.push(room);
      return acc;
    }, {});

    const totalRooms = rooms.length;
    const totalBeds = rooms.reduce((sum, r) => sum + r.capacity, 0);
    const occupiedBeds = rooms.reduce((sum, r) => sum + r.current_occupancy, 0);

    return NextResponse.json({
      success: true,
      data: {
        building,
        stats: {
          total_rooms: totalRooms,
          total_beds: totalBeds,
          occupied_beds: occupiedBeds,
          available_beds: totalBeds - occupiedBeds,
          occupancy_rate: totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0,
        },
        rooms_by_floor: Object.values(roomsByFloor),
        all_rooms: rooms,
      },
    });
  } catch (error) {
    console.error("Get building error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch building" },
      { status: 500 }
    );
  }
}

// PUT - Update building
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

    const building = await Building.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!building) {
      return NextResponse.json(
        { success: false, error: "Building not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Building updated successfully",
      data: building,
    });
  } catch (error) {
    console.error("Update building error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update building" },
      { status: 500 }
    );
  }
}

// DELETE - Hard delete building with cascade
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    // Find the building
    const building = await Building.findById(id);
    if (!building) {
      return NextResponse.json(
        { success: false, error: "Building not found" },
        { status: 404 }
      );
    }

    // ✅ Check if building has occupants (active assignments)
    const roomsWithOccupants = await Room.findOne({
      building_id: id,
      current_occupancy: { $gt: 0 },
    });

    if (roomsWithOccupants) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Cannot delete building with occupants",
          message: "Please remove all occupants from rooms first. Use 'Reset Dorm' to clear all assignments.",
          data: {
            building_name: building.name,
            occupied_rooms_count: await Room.countDocuments({ 
              building_id: id, 
              current_occupancy: { $gt: 0 } 
            }),
          }
        },
        { status: 400 }
      );
    }

    // ✅ Get all rooms in this building
    const rooms = await Room.find({ building_id: id });
    const roomIds = rooms.map(r => r._id);

    console.log(`🗑️ Deleting building: ${building.name} with ${rooms.length} rooms`);

    // ✅ Delete all dorm assignments for these rooms
    if (roomIds.length > 0) {
      const deletedAssignments = await DormAssignment.deleteMany({
        room_id: { $in: roomIds }
      });
      console.log(`  🗑️ Deleted ${deletedAssignments.deletedCount} dorm assignments`);
    }

    // ✅ Reset attendees who were assigned to these rooms
    const resetAttendees = await Attendee.updateMany(
      {
        dorm_assignment_id: { $in: await DormAssignment.find({ 
          room_id: { $in: roomIds } 
        }).distinct('_id') }
      },
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
    console.log(`  👤 Reset ${resetAttendees.modifiedCount} attendees`);

    // ✅ Delete all rooms in this building
    if (roomIds.length > 0) {
      const deletedRooms = await Room.deleteMany({ building_id: id });
      console.log(`  🏠 Deleted ${deletedRooms.deletedCount} rooms`);
    }

    // ✅ Delete the building (hard delete, not soft delete)
    const deletedBuilding = await Building.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Building "${building.name}" and all its rooms deleted successfully`,
      data: {
        building: {
          _id: building._id,
          building_id: building.building_id,
          name: building.name,
          type: building.type,
        },
        stats: {
          rooms_deleted: rooms.length,
          assignments_deleted: roomIds.length > 0 ? await DormAssignment.countDocuments({ 
            room_id: { $in: roomIds } 
          }) : 0,
          attendees_reset: resetAttendees.modifiedCount,
        },
      },
    });
  } catch (error) {
    console.error("Delete building error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete building",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}