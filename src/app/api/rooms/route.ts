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
  capacity: z.number().min(2, "Capacity must be at least 2").max(40, "Capacity cannot exceed 40"),
});

// ==================== ✅ FIXED: Helper function ====================
function getFloorName(floor: number): string {
  const floorNames: { [key: number]: string } = {
    1: '1st',    // ✅ Changed from 'Ground' to '1st'
    2: '2nd',
    3: '3rd',
    4: '4th',
    5: '5th',
    6: '6th',
    7: '7th',
    8: '8th',
    9: '9th',
    10: '10th',
    11: '11th',
    12: '12th',
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
      building_type: building.type,
      building_name: building.name,
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
    const is_active = searchParams.get('is_active'); // ✅ Filter for active/inactive
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '0');
    const skip = limit > 0 ? (page - 1) * limit : 0;

    // ==================== ✅ BUILD FILTER ====================
    const filter: any = {};

    // ✅ If building_id is provided, filter by it
    if (building_id) {
      filter.building_id = building_id;
    }

    // ✅ Handle is_active filter
    if (is_active !== null && is_active !== undefined && is_active !== '') {
      // If is_active parameter is provided, use it
      filter.is_active = is_active === 'true';
    }
    // ❌ REMOVED: Default is_active: true - now shows ALL rooms by default

    // Apply other filters
    if (building_type) filter.building_type = building_type;
    if (floor) filter.floor = parseInt(floor);
    if (is_full !== null && is_full !== '') filter.is_full = is_full === 'true';

    console.log('📊 Room filter:', JSON.stringify(filter, null, 2));

    // Build query
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

    // ==================== ✅ GET STATS ====================
    // Stats should count ALL rooms
    const statsFilter: any = {};
    if (building_id) {
      statsFilter.building_id = building_id;
    }

    const stats = await Room.aggregate([
      { $match: statsFilter },
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

    // Also get active rooms count for reference
    const activeStats = await Room.aggregate([
      { 
        $match: { 
          ...statsFilter,
          is_active: true 
        } 
      },
      {
        $group: {
          _id: '$building_type',
          total_rooms: { $sum: 1 },
          total_beds: { $sum: '$capacity' },
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
        stats: {
          all: stats,
          active: activeStats,
        },
        // ✅ Include filter info for debugging
        filter: filter,
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