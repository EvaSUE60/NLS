// src/app/api/attendees/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import { requireRole } from "@/src/lib/auth/middleware";
import { generateAttendeeId } from "@/src/lib/generateId";

// GET - List all attendees (with filters)
export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const region = searchParams.get('region') || '';
    const gender = searchParams.get('gender') || '';
    const checkedIn = searchParams.get('checkedIn');
    const paymentStatus = searchParams.get('paymentStatus') || '';

    // Build query
    const query: any = {};

    if (search) {
      query.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { unique_id: { $regex: search, $options: 'i' } },
      ];
    }

    if (region) query.region = region;
    if (gender) query.gender = gender;
    if (checkedIn !== null && checkedIn !== undefined && checkedIn !== '') {
      query.checked_in = checkedIn === 'true';
    }
    if (paymentStatus) query.payment_status = paymentStatus;

    const skip = (page - 1) * limit;
    const total = await Attendee.countDocuments(query);

    const attendees = await Attendee.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const regions = await Attendee.distinct('region');

    return NextResponse.json({
      success: true,
      data: {
        attendees,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        filters: {
          regions: regions.sort(),
        },
      },
    });
  } catch (error) {
    console.error("Get attendees error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendees" },
      { status: 500 }
    );
  }
}

// POST - Create a new attendee manually
export async function POST(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const {
      first_name,
      last_name,
      phone,
      email,
      gender,
      region,
      local_church,
      campus,
      payment_status = "pending",
      dorm_cache,
      seminars_cache,
      group_id,
    } = body;

    // Validate required fields
    if (!first_name || !last_name || !phone || !email || !gender || !region || !local_church || !campus) {
      return NextResponse.json(
        { 
          success: false, 
          error: "All required fields must be provided: first_name, last_name, phone, email, gender, region, local_church, campus" 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingEmail = await Attendee.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: "Attendee with this email already exists" },
        { status: 409 }
      );
    }

    // Check if phone already exists
    const existingPhone = await Attendee.findOne({ phone });
    if (existingPhone) {
      return NextResponse.json(
        { success: false, error: "Attendee with this phone number already exists" },
        { status: 409 }
      );
    }

    // Generate unique_id
    const unique_id = await generateAttendeeId();

    // Create attendee
    const attendee = await Attendee.create({
      unique_id,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone,
      email: email.toLowerCase().trim(),
      gender,
      region: region.trim(),
      local_church: local_church.trim(),
      campus: campus.trim(),
      payment_status,
      checked_in: false,
      dorm_cache: dorm_cache || {
        roomNumber: null,
        bedNumber: null,
        floor: null,
        buildingType: null,
      },
      seminars_cache: seminars_cache || {
        registered: [],
        attended: [],
      },
      group_id: group_id || null,
      synced_at: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Attendee created successfully",
      data: attendee,
    }, { status: 201 });
  } catch (error) {
    console.error("Create attendee error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create attendee" },
      { status: 500 }
    );
  }
}