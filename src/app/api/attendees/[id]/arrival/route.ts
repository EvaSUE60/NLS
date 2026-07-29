// src/app/api/attendees/[id]/arrival/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import User from "@/src/models/User";
import Building from "@/src/models/Building";
import Room from "@/src/models/Room";
import DormAssignment from "@/src/models/DormAssignment";
import { requireRole } from "@/src/lib/auth/middleware";
import { generateAssignmentId } from "@/src/lib/generateId";
import mongoose from "mongoose";
import { Types } from "mongoose";

// ==================== HELPER: Update Building Stats ====================
async function updateBuildingStats(buildingId: Types.ObjectId) {
  try {
    console.log(`📊 Updating building stats for building ID: ${buildingId}`);
    
    // Get all rooms for this building
    const rooms = await Room.find({ building_id: buildingId, is_active: true });
    
    // Calculate stats from rooms
    const totalRooms = rooms.length;
    const totalBeds = rooms.reduce((sum, room) => sum + room.capacity, 0);
    const totalOccupants = rooms.reduce((sum, room) => sum + (room.current_occupancy || 0), 0);
    const occupiedRooms = rooms.filter(room => (room.current_occupancy || 0) > 0).length;
    
    console.log(`📊 Calculated stats:`, {
      totalRooms,
      totalBeds,
      totalOccupants,
      occupiedRooms,
    });

    // Update building with calculated stats
    const updatedBuilding = await Building.findByIdAndUpdate(
      buildingId,
      {
        total_rooms: totalRooms,
        capacity: totalBeds,
        current_occupancy: totalOccupants,
        occupied_rooms: occupiedRooms,
      },
      { new: true }
    );

    console.log(`✅ Building stats updated:`, {
      name: updatedBuilding?.name,
      current_occupancy: updatedBuilding?.current_occupancy,
      occupied_rooms: updatedBuilding?.occupied_rooms,
      capacity: updatedBuilding?.capacity,
    });

    return updatedBuilding;
  } catch (error) {
    console.error("❌ Failed to update building stats:", error);
    throw error;
  }
}

// ==================== HELPER: Update Room Stats ====================
async function updateRoomStats(roomId: Types.ObjectId) {
  try {
    console.log(`📊 Updating room stats for room ID: ${roomId}`);
    
    // Get all active assignments for this room
    const assignments = await DormAssignment.find({
      room_id: roomId,
      status: "active",
    });

    const room = await Room.findById(roomId);
    if (!room) {
      console.log(`❌ Room not found: ${roomId}`);
      return null;
    }

    // Calculate occupancy
    const currentOccupancy = assignments.length;
    const isFull = currentOccupancy >= room.capacity;
    const checkInStatus = currentOccupancy === 0 ? "empty" :
                         currentOccupancy >= room.capacity ? "full" : "partial";

    // Update room
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

// ==================== MAIN POST HANDLER ====================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;
    const body = await request.json();
    const { method = "manual" } = body;
    const user = (request as NextRequest & { user: { user_id: string } }).user;

    console.log(`🔍 Checking in attendee: ${id}`);

    // ==================== FIND ATTENDEE ====================
    // Support both MongoDB _id and unique_id (NLS-2026-XXX)
    let attendee = null;
    
    // Check if it's a MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      attendee = await Attendee.findById(id);
    }
    
    // If not found by _id, try by unique_id
    if (!attendee) {
      attendee = await Attendee.findOne({ unique_id: id });
    }

    if (!attendee) {
      console.log(`❌ Attendee not found: ${id}`);
      return NextResponse.json(
        { 
          success: false, 
          error: "Attendee not found",
          message: `No attendee found with ID: ${id}`
        },
        { status: 404 }
      );
    }

    console.log(`👤 Found attendee: ${attendee.first_name} ${attendee.last_name} (${attendee.unique_id})`);

    // ==================== CHECK IF ALREADY ARRIVED ====================
    if (attendee.arrived) {
      console.log(`⚠️ Already arrived: ${attendee.first_name} ${attendee.last_name}`);
      return NextResponse.json({
        success: false,
        error: "Already arrived",
        message: `${attendee.first_name} ${attendee.last_name} has already arrived at ${attendee.arrival_time}`,
        data: {
          arrival_time: attendee.arrival_time,
          arrival_method: attendee.arrival_method,
        }
      }, { status: 400 });
    }

    // ==================== GET STAFF USER ====================
    const staffUser = await User.findOne({ user_id: user.user_id });
    if (!staffUser) {
      console.log(`❌ Staff user not found: ${user.user_id}`);
      return NextResponse.json(
        { 
          success: false, 
          error: "Staff user not found",
          message: `No staff user found with ID: ${user.user_id}`
        },
        { status: 404 }
      );
    }

    // ==================== AUTO-ASSIGN ROOM ====================
    let assignment = null;
    let room = null;
    let building = null;

    // Check if already assigned
    if (attendee.dorm_assignment_id) {
      assignment = await DormAssignment.findById(attendee.dorm_assignment_id);
      if (assignment) {
        room = await Room.findById(assignment.room_id);
        building = await Building.findById(assignment.building_id);
      }
    }

    // If no assignment, find and assign a room
    if (!assignment || !room) {
      // Get appropriate building based on gender
      const buildingType = attendee.gender === "Male" ? "men" : "women";
      building = await Building.findOne({ type: buildingType, is_active: true });

      if (!building) {
        return NextResponse.json(
          { 
            success: false, 
            error: "No building available",
            message: `No ${buildingType}'s building found. Please create one first.` 
          },
          { status: 400 }
        );
      }

      // Find available rooms
      const availableRooms = await Room.find({
        building_id: building._id,
        is_full: false,
        is_active: true,
      }).sort({ floor: 1, room_number: 1 });

      if (availableRooms.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: "No rooms available",
            message: `All rooms in ${building.name} are full.` 
          },
          { status: 400 }
        );
      }

      // Find first available room with space
      let selectedRoom = null;
      let selectedBed = null;

      const roomIds = availableRooms.map(r => r._id);
      const existingAssignments = await DormAssignment.find({
        room_id: { $in: roomIds },
        status: "active",
      });

      for (const room of availableRooms) {
        const roomOccupants = await DormAssignment.find({
          room_id: room._id,
          status: "active",
        });

        if (roomOccupants.length < room.capacity) {
          const occupiedBeds = new Set(
            existingAssignments
              .filter(a => a.room_id.toString() === room._id.toString())
              .map(a => a.bed_number)
          );

          const allBeds = room.bed_numbers || Array.from({ length: room.capacity }, (_, i) => i + 1);
          for (const bed of allBeds) {
            if (!occupiedBeds.has(bed)) {
              selectedBed = bed;
              break;
            }
          }

          if (selectedBed) {
            selectedRoom = room;
            break;
          }
        }
      }

      if (!selectedRoom || !selectedBed) {
        return NextResponse.json(
          { 
            success: false, 
            error: "No available bed found",
            message: "Unable to find an available bed in any room." 
          },
          { status: 400 }
        );
      }

      // Create assignment
      assignment = await DormAssignment.create({
        assignment_id: await generateAssignmentId(),
        attendee_id: attendee._id,
        room_id: selectedRoom._id,
        building_id: selectedRoom.building_id,
        bed_number: selectedBed,
        assigned_by: staffUser._id,
        assigned_at: new Date(),
        status: "active",
        notes: `Auto-assigned on check-in from ${attendee.region} region`,
      });

      room = selectedRoom;

      // ✅ UPDATE ROOM STATS
      await updateRoomStats(room._id);
      
      // ✅ UPDATE BUILDING STATS
      await updateBuildingStats(room.building_id);
    }

    // ==================== UPDATE ATTENDEE ====================
    attendee.arrived = true;
    attendee.arrival_time = new Date();
    attendee.arrival_checked_by = staffUser._id;
    attendee.arrival_method = method;

    // If assignment was created, update dorm_cache
    if (assignment && room) {
      attendee.dorm_assignment_id = assignment._id;
      attendee.dorm_cache = {
        roomNumber: room.room_number,
        bedNumber: assignment.bed_number,
        floor: room.floor_name,
        buildingType: building?.type || '',
        buildingName: building?.name || '',
      };
    }
    
    await attendee.save();

    console.log(`✅ Checked in and assigned: ${attendee.first_name} ${attendee.last_name} to ${room?.room_number}`);

    // Get the staff name for response
    const staffName = staffUser.name || staffUser.email;

    // ==================== RELOAD ATTENDEE ====================
    const updatedAttendee = await Attendee.findById(attendee._id).lean();

    if (!updatedAttendee) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to reload attendee data",
          message: "Attendee data could not be retrieved after update"
        },
        { status: 500 }
      );
    }

    // ==================== RESPONSE ====================
    return NextResponse.json({
      success: true,
      message: `${attendee.first_name} ${attendee.last_name} checked in and assigned to ${room?.room_number || 'room'}`,
      data: {
        attendee: {
          _id: updatedAttendee._id,
          unique_id: updatedAttendee.unique_id,
          first_name: updatedAttendee.first_name,
          last_name: updatedAttendee.last_name,
          full_name: `${updatedAttendee.first_name} ${updatedAttendee.last_name}`,
          region: updatedAttendee.region,
          gender: updatedAttendee.gender,
          arrived: updatedAttendee.arrived,
          arrival_time: updatedAttendee.arrival_time,
          arrival_method: updatedAttendee.arrival_method,
          dorm_cache: updatedAttendee.dorm_cache || {
            roomNumber: null,
            bedNumber: null,
            floor: null,
            buildingType: null,
            buildingName: null,
          },
        },
        assignment: assignment ? {
          id: assignment._id,
          assignment_id: assignment.assignment_id,
          room_number: room?.room_number,
          bed_number: assignment.bed_number,
          floor: room?.floor_name,
          building: {
            id: building?._id,
            name: building?.name,
            type: building?.type,
          },
        } : null,
        checked_by: staffName,
      }
    });
  } catch (error) {
    console.error("Arrival check-in error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to check in attendee",
        message: error instanceof Error ? error.message : "Something went wrong"
      },
      { status: 500 }
    );
  }
}