// src/app/api/attendees/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import { requireRole } from "@/src/lib/auth/middleware";

export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const searchBy = searchParams.get('by') || 'unique_id'; // unique_id, name, email, phone

    if (!query || query.length < 2) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Search query is required (min 2 characters)" 
        },
        { status: 400 }
      );
    }

    let searchQuery: any = {};
    
    if (searchBy === 'unique_id') {
      searchQuery.unique_id = { $regex: query, $options: 'i' };
    } else if (searchBy === 'name') {
      searchQuery.$or = [
        { first_name: { $regex: query, $options: 'i' } },
        { last_name: { $regex: query, $options: 'i' } },
        { full_name: { $regex: query, $options: 'i' } },
      ];
    } else if (searchBy === 'email') {
      searchQuery.email = { $regex: query, $options: 'i' };
    } else if (searchBy === 'phone') {
      searchQuery.phone = { $regex: query, $options: 'i' };
    } else {
      // Search all
      searchQuery.$or = [
        { unique_id: { $regex: query, $options: 'i' } },
        { first_name: { $regex: query, $options: 'i' } },
        { last_name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { phone: { $regex: query, $options: 'i' } },
      ];
    }

    const attendees = await Attendee.find(searchQuery)
      .limit(10)
      .select('unique_id first_name last_name region arrived arrival_time badge_printed dorm_cache')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        attendees,
        count: attendees.length,
        query,
        search_by: searchBy,
      }
    });
  } catch (error) {
    console.error("Search attendees error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to search attendees",
        message: error instanceof Error ? error.message : "Something went wrong"
      },
      { status: 500 }
    );
  }
}