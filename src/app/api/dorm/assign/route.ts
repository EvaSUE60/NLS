// src/app/api/dorm/assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import Building from "@/src/models/Building";
import Room from "@/src/models/Room";
import User from "@/src/models/User";
import DormAssignment from "@/src/models/DormAssignment";
import { requireRole } from "@/src/lib/auth/middleware";
import { generateAssignmentId } from "@/src/lib/generateId";

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();
    const user = (request as any).user;

    // Get admin user from database
    const adminUser = await User.findOne({ user_id: user.user_id });
    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Admin user not found" },
        { status: 404 }
      );
    }

    // ==================== STEP 1: Get ONLY Unassigned Attendees ====================
    const attendees = await Attendee.find({
      dorm_assignment_id: null,
    });

    if (attendees.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No attendees",
        message: "No attendees without room assignments",
      }, { status: 400 });
    }

    console.log(`📋 Found ${attendees.length} unassigned attendees`);

    // ==================== STEP 2: Get Buildings ====================
    const menBuilding = await Building.findOne({ type: "men", is_active: true });
    const womenBuilding = await Building.findOne({ type: "women", is_active: true });

    if (!menBuilding || !womenBuilding) {
      return NextResponse.json({
        success: false,
        error: "Buildings missing",
        message: "Please create both Men's and Women's buildings first",
      }, { status: 400 });
    }

    console.log(`🏠 Men's Building: ${menBuilding.name} (${menBuilding.total_rooms} rooms)`);
    console.log(`🏠 Women's Building: ${womenBuilding.name} (${womenBuilding.total_rooms} rooms)`);

    // ==================== STEP 3: Get Available Rooms ====================
    const menRooms = await Room.find({
      building_id: menBuilding._id,
      is_full: false,
      is_active: true,
    }).sort({ floor: 1, room_number: 1 });

    const womenRooms = await Room.find({
      building_id: womenBuilding._id,
      is_full: false,
      is_active: true,
    }).sort({ floor: 1, room_number: 1 });

    // Calculate total available beds
    const totalAvailableBeds = [...menRooms, ...womenRooms].reduce(
      (sum, room) => sum + (room.capacity - (room.current_occupancy || 0)),
      0
    );

    console.log(`🛏️ Available beds: ${totalAvailableBeds}`);

    if (totalAvailableBeds < attendees.length) {
      return NextResponse.json({
        success: false,
        error: "Not enough space",
        message: `Need ${attendees.length} beds but only ${totalAvailableBeds} available`,
      }, { status: 400 });
    }

    // ==================== STEP 4: Separate by Gender ====================
    const males = attendees.filter((a) => a.gender === "Male");
    const females = attendees.filter((a) => a.gender === "Female");

    console.log(`👨 Males: ${males.length}`);
    console.log(`👩 Females: ${females.length}`);

    // ==================== STEP 5: Shuffle for Random Distribution ====================
    const shuffledMales = shuffleArray(males);
    const shuffledFemales = shuffleArray(females);

    // ==================== STEP 6: Assignment Function ====================
    async function assignToRooms(
      attendeesList: any[],
      rooms: any[],
      buildingType: string,
      buildingName: string,
      adminUserId: string
    ) {
      const assignments = [];
      const unassigned = [];
      let roomIndex = 0;

      // Get existing active assignments for this building
      const roomIds = rooms.map(r => r._id);
      const existingAssignments = await DormAssignment.find({
        room_id: { $in: roomIds },
        status: "active",
      });

      // Create a map of room occupancy
      const roomOccupancy = new Map();
      for (const room of rooms) {
        const bedNumbers = room.bed_numbers || [1, 2, 3, 4];
        const occupiedBeds = existingAssignments
          .filter(a => a.room_id.toString() === room._id.toString())
          .map(a => a.bed_number);
        
        roomOccupancy.set(room._id.toString(), {
          room,
          occupants: room.occupants || [],
          occupiedBeds: new Set(occupiedBeds),
          regions: new Set(),
        });
      }

      for (const attendee of attendeesList) {
        let assigned = false;
        let attempts = 0;
        const maxAttempts = rooms.length * 2;

        while (!assigned && attempts < maxAttempts) {
          const roomData = roomOccupancy.get(rooms[roomIndex % rooms.length]._id.toString());
          const currentRoom = roomData?.room;

          if (currentRoom) {
            const currentOccupants = roomData.occupants || [];
            const currentOccupiedBeds = roomData.occupiedBeds || new Set();
            
            // Check if room has space
            if (currentOccupants.length < currentRoom.capacity) {
              // Check region diversity
              const occupantRegions = new Set();
              for (const occupantId of currentOccupants) {
                const occupant = attendeesList.find(
                  (a) => a._id.toString() === occupantId.toString()
                );
                if (occupant) {
                  occupantRegions.add(occupant.region);
                }
              }

              const hasSameRegion = occupantRegions.has(attendee.region);
              if (currentOccupants.length === 0 || !hasSameRegion) {
                // Find available bed number
                let bedNumber = 1;
                const allBeds = currentRoom.bed_numbers || [1, 2, 3, 4];
                for (const bed of allBeds) {
                  if (!currentOccupiedBeds.has(bed)) {
                    bedNumber = bed;
                    break;
                  }
                }

                // ✅ Create assignment
                const assignment = await DormAssignment.create({
                  assignment_id: generateAssignmentId(),
                  attendee_id: attendee._id,
                  room_id: currentRoom._id,
                  building_id: currentRoom.building_id,
                  bed_number: bedNumber,
                  assigned_by: adminUserId,
                  assigned_at: new Date(),
                  status: "active",
                  notes: `Assigned from ${attendee.region} region`,
                });

                console.log(`✅ Created assignment: ${assignment.assignment_id} for ${attendee.first_name} ${attendee.last_name}`);

                // ✅ Update attendee with dorm_assignment_id - USING findByIdAndUpdate for reliability
                const updatedAttendee = await Attendee.findByIdAndUpdate(
                  attendee._id,
                  {
                    $set: {
                      dorm_assignment_id: assignment._id,
                      dorm_cache: {
                        roomNumber: currentRoom.room_number,
                        bedNumber: bedNumber,
                        floor: currentRoom.floor_name,
                        buildingType: buildingType,
                        buildingName: buildingName,
                      },
                    },
                  },
                  { new: true }
                );

                if (updatedAttendee) {
                  console.log(`✅ Updated attendee: ${updatedAttendee.first_name} ${updatedAttendee.last_name} with assignment ID: ${updatedAttendee.dorm_assignment_id}`);
                }

                // Update room data
                roomData.occupants.push(attendee._id);
                roomData.occupiedBeds.add(bedNumber);
                roomData.regions.add(attendee.region);

                assignments.push({
                  attendee_id: attendee._id,
                  unique_id: attendee.unique_id,
                  full_name: `${attendee.first_name} ${attendee.last_name}`,
                  region: attendee.region,
                  room_number: currentRoom.room_number,
                  bed_number: bedNumber,
                  building_type: buildingType,
                  assignment_id: assignment.assignment_id,
                });
                
                assigned = true;
                break;
              }
            }
          }
          
          roomIndex++;
          attempts++;
        }

        if (!assigned) {
          unassigned.push({
            unique_id: attendee.unique_id,
            full_name: `${attendee.first_name} ${attendee.last_name}`,
            region: attendee.region,
          });
        }
      }

      // Update room stats
      for (const [roomId, roomData] of roomOccupancy) {
        const room = roomData.room;
        room.current_occupancy = roomData.occupants.length;
        room.is_full = room.current_occupancy >= room.capacity;
        room.check_in_status = room.current_occupancy === 0 ? "empty" :
                              room.current_occupancy >= room.capacity ? "full" : "partial";
        await room.save();
      }

      return { assignments, unassigned };
    }

    // ==================== STEP 7: Assign Males and Females ====================
    const adminUserId = adminUser._id.toString();

    const [maleResult, femaleResult] = await Promise.all([
      assignToRooms(shuffledMales, menRooms, "men", menBuilding.name, adminUserId),
      assignToRooms(shuffledFemales, womenRooms, "women", womenBuilding.name, adminUserId),
    ]);

    // ==================== STEP 8: Prepare Response ====================
    const totalAssigned = maleResult.assignments.length + femaleResult.assignments.length;
    const totalUnassigned = maleResult.unassigned.length + femaleResult.unassigned.length;

    // Group assignments by room
    const roomSummary: any = {};
    for (const assignment of [...maleResult.assignments, ...femaleResult.assignments]) {
      if (!roomSummary[assignment.room_number]) {
        roomSummary[assignment.room_number] = {
          room_number: assignment.room_number,
          building_type: assignment.building_type,
          occupants: [],
        };
      }
      roomSummary[assignment.room_number].occupants.push({
        unique_id: assignment.unique_id,
        full_name: assignment.full_name,
        region: assignment.region,
        bed_number: assignment.bed_number,
      });
    }

    // ✅ Get final stats - count attendees with dorm_assignment_id
    const totalAssignedCount = await Attendee.countDocuments({
      dorm_assignment_id: { $ne: null }
    });
    const unassignedCount = await Attendee.countDocuments({
      dorm_assignment_id: null
    });
    const totalAttendees = await Attendee.countDocuments();

    console.log(`📊 Final Stats: ${totalAssignedCount} assigned, ${unassignedCount} unassigned`);

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${totalAssigned} attendees to rooms`,
      data: {
        summary: {
          total_attendees: attendees.length,
          total_assigned: totalAssigned,
          total_unassigned: totalUnassigned,
          male_assigned: maleResult.assignments.length,
          female_assigned: femaleResult.assignments.length,
          overall_assigned: totalAssignedCount,
          overall_unassigned: unassignedCount,
          overall_total: totalAttendees,
        },
        rooms: {
          men: {
            building_name: menBuilding.name,
            assignments: maleResult.assignments,
            unassigned: maleResult.unassigned,
          },
          women: {
            building_name: womenBuilding.name,
            assignments: femaleResult.assignments,
            unassigned: femaleResult.unassigned,
          },
        },
        room_details: Object.values(roomSummary),
        unassigned: [...maleResult.unassigned, ...femaleResult.unassigned],
      },
    });
  } catch (error) {
    console.error("Room assignment error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to assign rooms",
      message: error instanceof Error ? error.message : "Something went wrong",
    }, { status: 500 });
  }
}