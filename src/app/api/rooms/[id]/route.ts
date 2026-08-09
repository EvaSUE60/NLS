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

// ==================== HELPER: Update Room Stats ====================
async function updateRoomStats(roomId: string | any) {
  try {
    console.log(`📊 Updating room stats for room ID: ${roomId}`);
    
    const assignments = await DormAssignment.find({
      room_id: roomId,
      status: "active",
    });

    const room = await Room.findById(roomId);
    if (!room) {
      console.log(`❌ Room not found: ${roomId}`);
      return null;
    }

    const currentOccupancy = assignments.length;
    const isFull = currentOccupancy >= room.capacity;
    const checkInStatus = currentOccupancy === 0 ? "empty" :
                         currentOccupancy >= room.capacity ? "full" : "partial";

    room.current_occupancy = currentOccupancy;
    room.is_full = isFull;
    room.check_in_status = checkInStatus;
    room.occupants = assignments.map(a => a.attendee_id);
    
    await room.save();

    console.log(`✅ Room stats updated:`, {
      room_number: room.room_number,
      current_occupancy: room.current_occupancy,
      is_full: room.is_full,
      check_in_status: room.check_in_status,
    });

    return room;
  } catch (error) {
    console.error("❌ Failed to update room stats:", error);
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

    const oldCapacity = existingRoom.capacity;
    const currentOccupancy = existingRoom.current_occupancy || 0;

    console.log(`📊 Updating room ${existingRoom.room_number}:`, {
      oldCapacity,
      newCapacity: body.capacity,
      currentOccupancy,
      currentIsFull: existingRoom.is_full,
      currentIsActive: existingRoom.is_active,
      newIsActive: body.is_active,
    });

    // ==================== HANDLE ACTIVE/INACTIVE TOGGLE ====================
    // If deactivating, check if room has occupants
    if (body.is_active === false && existingRoom.is_active === true) {
      if (currentOccupancy > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot deactivate room with occupants",
            message: `Room ${existingRoom.room_number} has ${currentOccupancy} occupant(s). Please remove them first before deactivating.`,
            data: {
              room_number: existingRoom.room_number,
              current_occupancy: currentOccupancy,
              suggestion: "Move occupants to another room or remove assignments first.",
            },
          },
          { status: 400 }
        );
      }
    }

    // If activating, check if building is active
    if (body.is_active === true && existingRoom.is_active === false) {
      const building = await Building.findById(existingRoom.building_id);
      if (building && !building.is_active) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot activate room in inactive building",
            message: `Building "${building.name}" is currently inactive. Please activate the building first.`,
          },
          { status: 400 }
        );
      }
    }

    // ==================== HANDLE CAPACITY CHANGE ====================
    if (body.capacity !== undefined) {
      if (currentOccupancy > body.capacity) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid capacity",
            message: `Cannot reduce capacity to ${body.capacity} because room has ${currentOccupancy} occupants. Please remove occupants first.`,
          },
          { status: 400 }
        );
      }

      // ✅ If capacity changes, update bed numbers
      if (body.capacity > 0) {
        const existingBedNumbers = existingRoom.bed_numbers || [];
        const newCapacity = body.capacity;
        const generatedBedNumbers = Array.from({ length: newCapacity }, (_, i) => i + 1);
        
        if (newCapacity > oldCapacity) {
          const assignments = await DormAssignment.find({
            room_id: id,
            status: "active",
          });
          const occupiedBeds = new Set(assignments.map(a => a.bed_number));
          
          const allBeds = new Set<number>(existingBedNumbers);
          for (let i = oldCapacity + 1; i <= newCapacity; i++) {
            allBeds.add(i);
          }
          // ✅ FIX: Explicitly type the sort parameters as numbers
          body.bed_numbers = Array.from(allBeds).sort((a: number, b: number) => a - b);
        } else if (newCapacity < oldCapacity) {
          const assignments = await DormAssignment.find({
            room_id: id,
            status: "active",
          });
          const occupiedBeds = new Set(assignments.map(a => a.bed_number));
          
          const keptBeds = new Set<number>(occupiedBeds);
          for (let i = 1; i <= newCapacity; i++) {
            keptBeds.add(i);
          }
          // ✅ FIX: Explicitly type the sort parameters as numbers
          body.bed_numbers = Array.from(keptBeds).sort((a: number, b: number) => a - b);
        } else {
          body.bed_numbers = generatedBedNumbers;
        }
      }
    }

    // Store building ID for stats update
    const buildingId = existingRoom.building_id;

    // ✅ Update the room
    const room = await Room.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // ==================== ✅ RECALCULATE ROOM STATUS ====================
    const assignments = await DormAssignment.find({
      room_id: room._id,
      status: "active",
    });

    const newOccupancy = assignments.length;
    const isFull = newOccupancy >= room.capacity;
    const checkInStatus = newOccupancy === 0 ? "empty" :
                         newOccupancy >= room.capacity ? "full" : "partial";

    room.current_occupancy = newOccupancy;
    room.is_full = isFull;
    room.check_in_status = checkInStatus;
    room.occupants = assignments.map(a => a.attendee_id);
    
    await room.save();

    console.log(`✅ Room status updated:`, {
      room_number: room.room_number,
      occupancy: `${newOccupancy}/${room.capacity}`,
      is_full: isFull,
      check_in_status: checkInStatus,
      is_active: room.is_active,
      bed_numbers: room.bed_numbers,
    });

    // ✅ Recalculate building stats
    await updateBuildingStats(buildingId);

    // Get updated room with populated data
    const updatedRoom = await Room.findById(room._id)
      .populate('occupants', 'first_name last_name unique_id');

    return NextResponse.json({
      success: true,
      message: `Room ${room.room_number} updated successfully`,
      data: updatedRoom,
    });
  } catch (error) {
    console.error("Update room error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to update room",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// ==================== PATCH - Toggle room active status ====================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { is_active } = body;

    if (is_active === undefined) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing is_active field",
          message: "Please provide is_active (true/false) in the request body."
        },
        { status: 400 }
      );
    }

    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    // If deactivating, check if room has occupants
    if (is_active === false && room.is_active === true) {
      const currentOccupancy = room.current_occupancy || 0;
      if (currentOccupancy > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot deactivate room with occupants",
            message: `Room ${room.room_number} has ${currentOccupancy} occupant(s). Please remove them first.`,
            data: {
              room_number: room.room_number,
              current_occupancy: currentOccupancy,
            },
          },
          { status: 400 }
        );
      }
    }

    // If activating, check if building is active
    if (is_active === true && room.is_active === false) {
      const building = await Building.findById(room.building_id);
      if (building && !building.is_active) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot activate room in inactive building",
            message: `Building "${building.name}" is currently inactive. Please activate the building first.`,
          },
          { status: 400 }
        );
      }
    }

    // Toggle status
    room.is_active = is_active;
    await room.save();

    // If deactivating, recalculate building stats (room no longer counted)
    if (is_active === false) {
      await updateBuildingStats(room.building_id);
    } else {
      // If activating, also recalculate building stats
      await updateBuildingStats(room.building_id);
    }

    const updatedRoom = await Room.findById(room._id)
      .populate('occupants', 'first_name last_name unique_id');

    return NextResponse.json({
      success: true,
      message: `Room ${room.room_number} ${is_active ? 'activated' : 'deactivated'} successfully`,
      data: updatedRoom,
    });
  } catch (error) {
    console.error("Toggle room status error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to toggle room status",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
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

    // Recalculate building stats after room deletion
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