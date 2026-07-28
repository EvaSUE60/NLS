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

// Helper function to update building stats
async function updateBuildingStats(buildingId: Types.ObjectId) {
  try {
    const rooms = await Room.find({ building_id: buildingId, is_active: true });
    const totalRooms = rooms.length;
    const totalBeds = rooms.reduce((sum, room) => sum + room.capacity, 0);
    const totalOccupants = rooms.reduce((sum, room) => sum + (room.current_occupancy || 0), 0);
    const occupiedRooms = rooms.filter(room => room.current_occupancy > 0).length;

    await Building.findByIdAndUpdate(buildingId, {
      total_rooms: totalRooms,
      capacity: totalBeds,
      current_occupancy: totalOccupants,
      occupied_rooms: occupiedRooms,
    });
  } catch (error) {
    console.error("Failed to update building stats:", error);
  }
}

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

    // ✅ Support both MongoDB _id and unique_id (NLS-2026-XXX)
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

    // Check if already arrived
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

    // Get the staff user
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

      // Update room stats
      const roomAssignments = await DormAssignment.find({
        room_id: room._id,
        status: "active",
      });
      
      room.current_occupancy = roomAssignments.length;
      room.is_full = roomAssignments.length >= room.capacity;
      room.check_in_status = roomAssignments.length === 0 ? "empty" :
                            roomAssignments.length >= room.capacity ? "full" : "partial";
      await room.save();

      // Update building stats
      await updateBuildingStats(room.building_id);
    }

    // ✅ Update attendee - ARRIVAL CHECK-IN with assignment
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

    // ✅ RELOAD the attendee to get all fields
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

    // ✅ Build response with all fields from the model
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
          phone: updatedAttendee.phone,
          email: updatedAttendee.email,
          gender: updatedAttendee.gender,
          region: updatedAttendee.region,
          local_church: updatedAttendee.local_church,
          campus: updatedAttendee.campus,
          payment_status: updatedAttendee.payment_status,
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