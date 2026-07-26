// src/app/api/rooms/route.ts - Updated GET handler
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Building from "@/src/models/Building";
import Room from "@/src/models/Room";
import { requireRole } from "@/src/lib/auth/middleware";
import mongoose from "mongoose";
import { z } from "zod";

const createRoomSchema = z.object({
  building_id: z.string().min(1, "Building ID is required"),
  floor: z.number().min(1, "Floor number is required"),
  room_number: z.string().min(1, "Room number is required"),
  capacity: z.number().min(2, "Capacity must be at least 2").max(25, "Capacity cannot exceed 25"),
});

// Helper function
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

// POST - Create a single room
export async function POST(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const validationResult = createRoomSchema.safeParse(body);

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

    const { building_id, floor, room_number, capacity } = validationResult.data;

    // Get building details
    const building = await Building.findById(building_id);
    if (!building) {
      return NextResponse.json(
        { success: false, error: "Building not found" },
        { status: 404 }
      );
    }

    // Check if room exists in this building
    const existingRoom = await Room.findOne({ building_id, room_number });
    if (existingRoom) {
      return NextResponse.json(
        {
          success: false,
          error: "Room exists",
          message: `Room ${room_number} already exists in ${building.name}`,
        },
        { status: 409 }
      );
    }

    const room = await Room.create({
      room_id: `RM-${building.building_id}-${floor}-${room_number}`,
      room_number,
      building_id: building._id,
      building_type: building.type, // ✅ Add building type
      building_name: building.name, // ✅ Add building name
      floor,
      floor_name: getFloorName(floor),
      capacity,
      occupants: [],
      current_occupancy: 0,
      is_full: false,
      bed_numbers: Array.from({ length: capacity }, (_, i) => i + 1),
      check_in_status: "empty",
      is_active: true,
    });

    return NextResponse.json({
      success: true,
      message: `Room ${room_number} created successfully with ${capacity} beds`,
      data: room,
    }, { status: 201 });
  } catch (error) {
    console.error("Create room error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create room" },
      { status: 500 }
    );
  }
}

// GET - List all rooms with filters
// src/app/api/rooms/route.ts - Update GET handler

// GET - List all rooms with filters
export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const building_id = searchParams.get('building_id');
    const building_type = searchParams.get('building_type');
    const floor = searchParams.get('floor');
    const is_full = searchParams.get('is_full');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '0'); // ✅ 0 means no limit
    const skip = limit > 0 ? (page - 1) * limit : 0;

    // Get all active building IDs
    const activeBuildings = await Building.find({ is_active: true }).select('_id');
    const activeBuildingIds = activeBuildings.map(b => b._id);

    const filter: any = { 
      is_active: true,
      building_id: { $in: activeBuildingIds } 
    };
    
    if (building_id) {
      const building = await Building.findOne({ _id: building_id, is_active: true });
      if (!building) {
        return NextResponse.json({
          success: true,
          data: {
            rooms: [],
            pagination: {
              page: 1,
              limit: 0,
              total: 0,
              pages: 0,
            },
            stats: [],
          },
        });
      }
      filter.building_id = building_id;
    }
    
    if (building_type) filter.building_type = building_type;
    if (floor) filter.floor = parseInt(floor);
    if (is_full !== null && is_full !== '') filter.is_full = is_full === 'true';

    // ✅ Build query with proper limit handling
    let query = Room.find(filter)
      .populate('building_id', 'name type')
      .sort({ building_type: 1, floor: 1, room_number: 1 });

    // Apply limit only if specified
    if (limit > 0) {
      query = query.skip(skip).limit(limit);
    }

    // Try to populate occupants
    try {
      if (mongoose.models.Attendee) {
        query = query.populate('occupants', 'first_name last_name unique_id');
      }
    } catch (error) {
      console.log('Attendee model not available for populate, skipping...');
    }

    const [rooms, total] = await Promise.all([
      query.lean(),
      Room.countDocuments(filter),
    ]);

    // Transform rooms
    const transformedRooms = rooms.map((room: any) => {
      const building = room.building_id || {};
      return {
        ...room,
        building_name: building.name || room.building_name || 'Unknown',
        building_type: building.type || room.building_type || 'unknown',
        building_id: room.building_id?._id || room.building_id,
      };
    });

    // Get stats
    const stats = await Room.aggregate([
      { 
        $match: { 
          is_active: true,
          building_id: { $in: activeBuildingIds }
        } 
      },
      {
        $group: {
          _id: '$building_type',
          total_rooms: { $sum: 1 },
          occupied_rooms: { $sum: { $cond: [{ $eq: ['$is_full', true] }, 1, 0] } },
          total_beds: { $sum: '$capacity' },
          occupied_beds: { $sum: '$current_occupancy' },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        rooms: transformedRooms,
        pagination: {
          page,
          limit,
          total,
          pages: limit > 0 ? Math.ceil(total / limit) : 1,
        },
        stats,
      },
    });
  } catch (error) {
    console.error("Get rooms error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}