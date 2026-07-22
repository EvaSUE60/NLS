// src/app/api/attendees/arrival-stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import { requireRole } from "@/src/lib/auth/middleware";

export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    // Total attendees
    const total = await Attendee.countDocuments();
    
    // Arrived
    const arrived = await Attendee.countDocuments({ arrived: true });
    const notArrived = total - arrived; // ✅ Calculate this
    
    // Arrivals by region
    const byRegion = await Attendee.aggregate([
      {
        $group: {
          _id: '$region',
          total: { $sum: 1 },
          arrived: { $sum: { $cond: [{ $eq: ['$arrived', true] }, 1, 0] } },
          not_arrived: { $sum: { $cond: [{ $eq: ['$arrived', false] }, 1, 0] } },
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Recent arrivals (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentArrivals = await Attendee.countDocuments({
      arrived: true,
      arrival_time: { $gte: oneHourAgo }
    });

    // Last 10 arrivals
    const lastArrivals = await Attendee.find({ arrived: true })
      .sort({ arrival_time: -1 })
      .limit(10)
      .select('unique_id first_name last_name region arrival_time arrival_method')
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total_attendees: total,
          arrived,
          not_arrived: notArrived, // ✅ Now defined
          arrival_rate: total > 0 ? ((arrived / total) * 100).toFixed(1) : 0,
          recent_arrivals: recentArrivals,
        },
        by_region: byRegion,
        recent_check_ins: lastArrivals,
      }
    });
  } catch (error) {
    console.error("Arrival stats error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to get arrival statistics",
        message: error instanceof Error ? error.message : "Something went wrong"
      },
      { status: 500 }
    );
  }
}