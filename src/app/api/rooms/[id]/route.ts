// src/app/api/rooms/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Room from "@/src/models/Room";
import Building from "@/src/models/Building";
import DormAssignment from "@/src/models/DormAssignment";
import Attendee from "@/src/models/Attendee";
import { requireRole } from "@/src/lib/auth/middleware";

// ==================== HELPER: Update Building Stats ====================
async function updateBuildingStats(buildingId: string | any) {
  try {
    // Get all active rooms for this building
    const rooms = await Room.find({ 
      building_id: buildingId, 
      is_active: true 
    });

    const totalRooms = rooms.length;
    const totalBeds = rooms.reduce((sum, room) => sum + room.capacity, 0);
    const totalOccupants = rooms.reduce((sum, room) => sum + (room.current_occupancy || 0), 0);
    const occupiedRooms = rooms.filter(room => room.current_occupancy > 0).length;

    // Update building with calculated stats
    await Building.findByIdAndUpdate(buildingId, {
      total_rooms: totalRooms,
      capacity: totalBeds,
      current_occupancy: totalOccupants,
      occupied_rooms: occupiedRooms,
    });

    console.log(`✅ Building stats updated: ${buildingId}`, {
      totalRooms,
      totalBeds,
      totalOccupants,
      occupiedRooms,
    });

    return {
      totalRooms,
      totalBeds,
      totalOccupants,
      occupiedRooms,
    };
  } catch (error) {
    console.error(`Failed to update building stats for ${buildingId}:`, error);
    throw error;
  }
}

// ==================== GET - Get single room with occupants ====================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    const room = await Room.findById(id)
      .populate('building_id', 'name type')
      .populate({
        path: 'occupants',
        select: 'first_name last_name unique_id email phone region dorm_cache has_room seminars_cache sessions_cache'
      })
      .lean();

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // Get building info from populated data or fallback
    const building = room.building_id || {};
    const buildingName = building.name || room.building_name || 'Unknown';
    const buildingType = building.type || room.building_type || 'unknown';

    // Get active assignments for this room
    const assignments = await DormAssignment.find({
      room_id: id,
      status: "active",
    })
      .populate('attendee_id', 'first_name last_name unique_id')
      .populate('assigned_by', 'name email')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        ...room,
        building_name: buildingName,
        building_type: buildingType,
        building_id: room.building_id?._id || room.building_id,
        assignments,
      },
    });
  } catch (error) {
    console.error("Get room error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch room" },
      { status: 500 }
    );
  }
}

// ==================== PUT - Update room ====================
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

    // Get existing room first
    const existingRoom = await Room.findById(id);
    if (!existingRoom) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // If capacity is being changed, check if it's still valid
    if (body.capacity !== undefined) {
      if (existingRoom.current_occupancy > body.capacity) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid capacity",
            message: `Cannot reduce capacity to ${body.capacity} because room has ${existingRoom.current_occupancy} occupants. Please remove occupants first.`,
          },
          { status: 400 }
        );
      }

      // If capacity changes, update bed numbers
      if (body.capacity > 0) {
        body.bed_numbers = Array.from({ length: body.capacity }, (_, i) => i + 1);
      }
    }

    // Store building ID for stats update
    const buildingId = existingRoom.building_id;

    // Update the room
    const room = await Room.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).populate('occupants', 'first_name last_name unique_id');

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // ✅ UPDATE: Recalculate building stats after room update
    await updateBuildingStats(buildingId);

    return NextResponse.json({
      success: true,
      message: "Room updated successfully",
      data: room,
    });
  } catch (error) {
    console.error("Update room error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update room" },
      { status: 500 }
    );
  }
}

// ==================== DELETE - Hard delete room with cascade ====================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // Store building ID for stats update after deletion
    const buildingId = room.building_id;

    // Check if room has occupants
    if (room.current_occupancy > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete room with occupants",
          message: `This room has ${room.current_occupancy} occupant(s). Please remove them first.`,
          data: {
            room_number: room.room_number,
            current_occupancy: room.current_occupancy,
            suggestion: "Use '/api/dorm/reset' to clear all assignments or manually remove occupants.",
          },
        },
        { status: 400 }
      );
    }

    // Get all assignments for this room
    const assignments = await DormAssignment.find({
      room_id: id,
      status: "active",
    });

    // Delete assignments and reset attendees
    if (assignments.length > 0) {
      const assignmentIds = assignments.map(a => a._id);
      
      // Reset attendees
      await Attendee.updateMany(
        { dorm_assignment_id: { $in: assignmentIds } },
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
      console.log(`👤 Reset ${assignmentIds.length} attendees`);

      // Delete assignments
      await DormAssignment.deleteMany({
        room_id: id,
        status: "active",
      });
      console.log(`🗑️ Deleted ${assignments.length} dorm assignments`);
    }

    // Delete the room (hard delete)
    await Room.findByIdAndDelete(id);

    // ✅ UPDATE: Recalculate building stats after room deletion
    await updateBuildingStats(buildingId);

    return NextResponse.json({
      success: true,
      message: `Room ${room.room_number} deleted successfully`,
      data: {
        room: {
          _id: room._id,
          room_number: room.room_number,
          building_name: room.building_name,
        },
        deleted_assignments: assignments.length,
      },
    });
  } catch (error) {
    console.error("Delete room error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete room",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}