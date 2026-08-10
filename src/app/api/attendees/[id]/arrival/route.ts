// src/app/api/attendees/[id]/arrival/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import User from "@/src/models/User";
import Building from "@/src/models/Building";
import Room from "@/src/models/Room";
import DormAssignment from "@/src/models/DormAssignment";
import Group from "@/src/models/Group";
import { requireRole } from "@/src/lib/auth/middleware";
import { generateAssignmentId } from "@/src/lib/generateId";
import mongoose from "mongoose";
import { Types } from "mongoose";

// ==================== HELPER: Update Building Stats ====================
async function updateBuildingStats(buildingId: Types.ObjectId) {
  try {
    console.log(`📊 Updating building stats for building ID: ${buildingId}`);
    
    const rooms = await Room.find({ building_id: buildingId, is_active: true });
    
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

// ==================== HELPER: Assign Attendee to Group ====================
async function assignAttendeeToGroup(attendee: any) {
  try {
    console.log(`👥 Assigning group for: ${attendee.first_name} ${attendee.last_name}`);
    
    if (attendee.group_id) {
      console.log(`⚠️ Already in group: ${attendee.group_id}`);
      return { success: true, group: null, message: "Already in a group" };
    }

    const group = await Group.findOne({ 
      is_active: true 
    }).sort({ current_size: 1 });

    if (!group) {
      console.log(`⚠️ No active groups available`);
      return { success: false, group: null, message: "No groups available" };
    }

    if (group.current_size >= group.max_size) {
      console.log(`⚠️ All groups are full`);
      return { success: false, group: null, message: "All groups are full" };
    }

    group.members.push({
      attendeeId: attendee._id,
      unique_id: attendee.unique_id,
      fullName: `${attendee.first_name} ${attendee.last_name}`,
      region: attendee.region,
      joinedAt: new Date(),
    });

    const regionDist = group.region_distribution || [];
    const regionEntry = regionDist.find((r: any) => r.region === attendee.region);
    if (regionEntry) {
      regionEntry.count += 1;
    } else {
      regionDist.push({ region: attendee.region, count: 1 });
    }
    group.region_distribution = regionDist;

    group.current_size = group.members.length;
    group.points = 40;
    await group.save();

    attendee.group_id = group._id;
    await attendee.save();

    console.log(`✅ Assigned ${attendee.first_name} ${attendee.last_name} to ${group.name} (${group.current_size}/${group.max_size})`);

    return { 
      success: true, 
      group, 
      message: `Assigned to ${group.name}` 
    };
  } catch (error) {
    console.error("❌ Failed to assign to group:", error);
    return { success: false, group: null, message: "Failed to assign group" };
  }
}

// ==================== HELPER: Get User-Friendly Error Message ====================
function getUserFriendlyErrorMessage(error: string, attendeeName?: string, attendeeId?: string): string {
  const errorMessages: Record<string, string> = {
    'Already arrived': attendeeName 
      ? `✨ ${attendeeName} (${attendeeId}) has already checked in! They're all set.` 
      : `✨ This attendee has already checked in!`,
    'Attendee not found': `❌ Oops! We couldn't find an attendee with that ID. Please check the NLS ID and try again.`,
    'No building available': `🏗️ No building found for this attendee's gender. Please create a building first.`,
    'No rooms available': `🛏️ All rooms are full! Please free up some space or add more rooms.`,
    'No available bed found': `🛏️ No beds available in any room. Please check room capacity and assignments.`,
    'Staff user not found': `👤 Staff user not found. Please log in again.`,
    'Failed to reload attendee data': `🔄 Something went wrong while loading attendee data. Please try again.`,
    'Failed to check in attendee': `❌ Unable to complete check-in. Please try again or contact support.`,
  };

  // Check if error contains specific keywords
  if (error.includes('building')) {
    return errorMessages['No building available'];
  }
  if (error.includes('room')) {
    return errorMessages['No rooms available'];
  }
  if (error.includes('bed')) {
    return errorMessages['No available bed found'];
  }
  if (error.includes('staff')) {
    return errorMessages['Staff user not found'];
  }

  return errorMessages[error] || `❌ ${error}. Please try again.`;
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
    let attendee = null;
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      attendee = await Attendee.findById(id);
    }
    
    if (!attendee) {
      attendee = await Attendee.findOne({ unique_id: id });
    }

    if (!attendee) {
      console.log(`❌ Attendee not found: ${id}`);
      return NextResponse.json(
        { 
          success: false, 
          error: "Attendee not found",
          message: `❌ Oops! We couldn't find an attendee with ID: ${id}. Please check the NLS ID and try again.`,
          userFriendlyMessage: `❌ Oops! We couldn't find an attendee with that ID. Please check the NLS ID and try again.`
        },
        { status: 404 }
      );
    }

    console.log(`👤 Found attendee: ${attendee.first_name} ${attendee.last_name} (${attendee.unique_id})`);

    // ==================== CHECK IF ALREADY ARRIVED ====================
    if (attendee.arrived) {
      console.log(`⚠️ Already arrived: ${attendee.first_name} ${attendee.last_name}`);
      const arrivalTime = attendee.arrival_time 
        ? new Date(attendee.arrival_time).toLocaleString() 
        : 'earlier';
      
      return NextResponse.json({
        success: false,
        error: "Already arrived",
        message: `✨ ${attendee.first_name} ${attendee.last_name} (${attendee.unique_id}) has already checked in! They checked in at ${arrivalTime}.`,
        userFriendlyMessage: `✨ ${attendee.first_name} ${attendee.last_name} has already checked in! They're all set. 🎉`,
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
          message: `👤 Staff user not found. Please log in again.`,
          userFriendlyMessage: `👤 Please log in again to continue.`
        },
        { status: 404 }
      );
    }

    // ==================== AUTO-ASSIGN ROOM ====================
    let assignment = null;
    let room = null;
    let building = null;

    if (attendee.dorm_assignment_id) {
      assignment = await DormAssignment.findById(attendee.dorm_assignment_id);
      if (assignment) {
        room = await Room.findById(assignment.room_id);
        building = await Building.findById(assignment.building_id);
      }
    }

    if (!assignment || !room) {
      const buildingType = attendee.gender === "Male" ? "men" : "women";
      building = await Building.findOne({ type: buildingType, is_active: true });

      if (!building) {
        return NextResponse.json(
          { 
            success: false, 
            error: "No building available",
            message: `🏗️ No ${buildingType}'s building found. Please create one first.`,
            userFriendlyMessage: `🏗️ We couldn't find a ${buildingType}'s building. Please ask an admin to set one up.`
          },
          { status: 400 }
        );
      }

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
            message: `🛏️ All rooms in ${building.name} are full.`,
            userFriendlyMessage: `🛏️ All rooms in ${building.name} are currently full! Please free up some space or add more rooms.`
          },
          { status: 400 }
        );
      }

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
            message: `🛏️ Unable to find an available bed in any room.`,
            userFriendlyMessage: `🛏️ No beds available! All rooms are fully occupied. Please check room assignments.`
          },
          { status: 400 }
        );
      }

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

      await updateRoomStats(room._id);
      await updateBuildingStats(room.building_id);
    }

    // ==================== AUTO-ASSIGN GROUP ====================
    const groupResult = await assignAttendeeToGroup(attendee);

    // ==================== UPDATE ATTENDEE ====================
    attendee.arrived = true;
    attendee.arrival_time = new Date();
    attendee.arrival_checked_by = staffUser._id;
    attendee.arrival_method = method;

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

    const staffName = staffUser.name || staffUser.email;

    // ==================== RELOAD ATTENDEE ====================
    const updatedAttendee = await Attendee.findById(attendee._id).lean();

    if (!updatedAttendee) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Failed to reload attendee data",
          message: `🔄 Something went wrong while loading attendee data. Please try again.`,
          userFriendlyMessage: `🔄 Something went wrong. Please try checking in again.`
        },
        { status: 500 }
      );
    }

    // ==================== RESPONSE ====================
    const successMessage = `✅ ${attendee.first_name} ${attendee.last_name} (${attendee.unique_id}) checked in and assigned to ${room?.room_number || 'room'}${groupResult.success ? ` and ${groupResult.message}` : ''}!`;

    return NextResponse.json({
      success: true,
      message: successMessage,
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
          group_id: updatedAttendee.group_id,
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
        group: groupResult.success && groupResult.group ? {
          id: groupResult.group._id,
          name: groupResult.group.name,
          group_code: groupResult.group.group_code,
          member_count: groupResult.group.current_size,
          max_size: groupResult.group.max_size,
        } : null,
        checked_by: staffName,
      }
    });
  } catch (error) {
    console.error("Arrival check-in error:", error);
    
    // Extract error message
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    const userFriendlyMessage = getUserFriendlyErrorMessage(errorMessage);
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to check in attendee",
        message: userFriendlyMessage,
        userFriendlyMessage: userFriendlyMessage,
        technicalMessage: errorMessage
      },
      { status: 500 }
    );
  }
}