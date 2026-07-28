// src/app/api/public/seminars/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Seminar from "@/src/models/Seminar";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const day = searchParams.get('day');

    const query: any = {
      is_active: true,
      isClosed: false,
    };
    
    if (day) {
      query.day = parseInt(day);
    }

    const seminars = await Seminar.find(query)
      .sort({ day: 1, start_time: 1 })
      .lean();

    // Format for public view
    const formattedSeminars = seminars.map(seminar => ({
      _id: seminar._id,
      name: seminar.name,
      day: seminar.day,
      date: seminar.date,
      start_time: seminar.start_time,
      end_time: seminar.end_time,
      building: seminar.building,
      room: seminar.room,
      capacity: seminar.capacity,
      participants: seminar.participants || [],
      isClosed: seminar.isClosed || false,
      is_active: seminar.is_active,
    }));

    return NextResponse.json({
      success: true,
      data: {
        seminars: formattedSeminars,
        total: formattedSeminars.length,
        day: day ? parseInt(day) : null,
      },
    });
  } catch (error) {
    console.error("Public seminars error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch seminars",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}