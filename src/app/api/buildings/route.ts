// src/app/api/buildings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Building from "@/src/models/Building";
import Room from "@/src/models/Room";
import { requireRole } from "@/src/lib/auth/middleware";
import { generateBuildingId } from "@/src/lib/generateId";
import { z } from "zod";

const createBuildingSchema = z.object({
  name: z.string().min(1, "Building name is required"),
  type: z.enum(["men", "women"]),
  total_floors: z.number().min(1, "At least 1 floor required"),
  rooms_per_floor: z.number().min(1, "At least 1 room per floor required"),
  default_capacity: z.number().min(2).max(4).default(4),
  address: z.string().optional(),
  description: z.string().optional(),
});

// Helper: Convert floor number to Roman numeral
function toRomanNumeral(num: number): string {
  const romanNumerals: { [key: number]: string } = {
    1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
    6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X',
  };
  return romanNumerals[num] || num.toString();
}

function getFloorPrefix(floor: number): string {
  if (floor === 0) return "G";
  return toRomanNumeral(floor);
}

// Helper: Get floor name
function getFloorName(floor: number): string {
  const floorNames: { [key: number]: string } = {
    1: 'Ground',
    2: '1st',
    3: '2nd',
    4: '3rd',
    5: '4th',
    6: '5th',
  };
  return floorNames[floor] || `${floor}th`;
}

// POST: Create building with rooms
// src/app/api/buildings/route.ts - Updated POST handler
export async function POST(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const validationResult = createBuildingSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          message: validationResult.error.issues[0]?.message || "Validation failed",
        },
        { status: 400 }
      );
    }

    const { name, type, total_floors, rooms_per_floor, default_capacity, address, description } = validationResult.data;

    // Check if building already exists
    const existing = await Building.findOne({ name });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Building exists", message: `Building "${name}" already exists` },
        { status: 409 }
      );
    }

    // Create building with correct field names
    const building = await Building.create({
      building_id: generateBuildingId(),
      name,
      type,
      floors: total_floors,  // Use 'floors' field
      total_rooms: 0,
      occupied_rooms: 0,
      capacity: 0,
      current_occupancy: 0,
      address,
      description,
      is_active: true,
    });

    // Generate rooms
    const floorNames = ["Ground", "1st", "2nd", "3rd", "4th", "5th"];
    const rooms = [];
    
    for (let floor = 1; floor <= total_floors; floor++) {
      const floorName = floorNames[floor - 1] || `${floor}th`;
      
      for (let room = 1; room <= rooms_per_floor; room++) {
        const roomNumber = `${floor}-${String(room).padStart(2, '0')}`;
        rooms.push({
          room_id: `RM-${building.building_id}-${floor}-${String(room).padStart(2, '0')}`,
          room_number: roomNumber,
          building_id: building._id,
          floor: floor,
          floor_name: floorName,
          capacity: default_capacity,
          occupants: [],
          current_occupancy: 0,
          is_full: false,
          bed_numbers: Array.from({ length: default_capacity }, (_, i) => i + 1),
          check_in_status: "empty",
          is_active: true,
        });
      }
    }

    let insertedCount = 0;
    if (rooms.length > 0) {
      try {
        const result = await Room.insertMany(rooms, { ordered: false });
        insertedCount = result.length;
      } catch (error: any) {
        if (error.code === 11000) {
          // Handle duplicates by inserting one by one
          for (const room of rooms) {
            try {
              const exists = await Room.findOne({ 
                building_id: building._id, 
                room_number: room.room_number 
              });
              if (!exists) {
                await Room.create(room);
                insertedCount++;
              }
            } catch (err) {
              console.log(`Room ${room.room_number} already exists`);
            }
          }
        } else {
          throw error;
        }
      }
    }

    // Update building with room stats
    const totalRooms = await Room.countDocuments({ building_id: building._id });
    const totalCapacity = totalRooms * default_capacity;
    
    await Building.findByIdAndUpdate(building._id, {
      total_rooms: totalRooms,
      capacity: totalCapacity,
    });

    const updatedBuilding = await Building.findById(building._id);

    return NextResponse.json({
      success: true,
      message: `Building "${name}" created with ${insertedCount} rooms`,
      data: {
        building: updatedBuilding,
        total_rooms: totalRooms,
        inserted_rooms: insertedCount,
        total_capacity: totalCapacity,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Create building error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create building",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// GET: List all buildings
export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const buildings = await Building.find({ is_active: true }).sort({ created_at: -1 });

    const buildingsWithStats = await Promise.all(
      buildings.map(async (building) => {
        const rooms = await Room.find({ building_id: building._id, is_active: true });
        const roomCount = rooms.length;
        const totalBeds = rooms.reduce((sum, room) => sum + room.capacity, 0);
        const occupiedRooms = rooms.filter((r) => r.is_full || r.current_occupancy > 0).length;
        const totalOccupants = rooms.reduce((sum, room) => sum + (room.current_occupancy || 0), 0);
        
        return {
          ...building.toObject(),
          room_count: roomCount,
          occupied_rooms: occupiedRooms,
          available_rooms: roomCount - occupiedRooms,
          total_occupants: totalOccupants,
          total_beds: totalBeds,
          available_beds: totalBeds - totalOccupants,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: buildingsWithStats,
    });
  } catch (error) {
    console.error("Get buildings error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch buildings",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}