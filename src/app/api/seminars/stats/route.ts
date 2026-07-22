// src/app/api/seminars/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Seminar from "@/src/models/Seminar";
import { requireRole } from "@/src/lib/auth/middleware";

export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const day = searchParams.get('day');

    const matchStage: any = {};
    if (day) matchStage.day = parseInt(day);

    // Overall stats
    const totalSeminars = await Seminar.countDocuments({ is_active: true });
    const totalParticipants = await Seminar.aggregate([
      { $match: { is_active: true } },
      { $project: { participantCount: { $size: "$participants" } } },
      { $group: { _id: null, total: { $sum: "$participantCount" } } },
    ]);

    const totalAttended = await Seminar.aggregate([
      { $match: { is_active: true } },
      { $unwind: "$participants" },
      { $match: { "participants.attended": true } },
      { $count: "total" },
    ]);

    // Stats by day
    const byDay = await Seminar.aggregate([
      { $match: { is_active: true } },
      {
        $group: {
          _id: "$day",
          total_seminars: { $sum: 1 },
          total_registered: { $sum: { $size: "$participants" } },
          total_attended: {
            $sum: {
              $size: {
                $filter: {
                  input: "$participants",
                  as: "p",
                  cond: { $eq: ["$$p.attended", true] },
                },
              },
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top seminars by registration
    const topSeminars = await Seminar.aggregate([
      { $match: { is_active: true } },
      {
        $project: {
          name: 1,
          seminar_key: 1,
          day: 1,
          registered_count: { $size: "$participants" },
          attended_count: {
            $size: {
              $filter: {
                input: "$participants",
                as: "p",
                cond: { $eq: ["$$p.attended", true] },
              },
            },
          },
        },
      },
      { $sort: { registered_count: -1 } },
      { $limit: 10 },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total_seminars: totalSeminars,
          total_registrations: totalParticipants[0]?.total || 0,
          total_attendance: totalAttended[0]?.total || 0,
          attendance_rate: totalParticipants[0]?.total > 0 
            ? ((totalAttended[0]?.total / totalParticipants[0]?.total) * 100).toFixed(1) 
            : 0,
        },
        by_day: byDay,
        top_seminars: topSeminars,
      },
    });
  } catch (error) {
    console.error("Seminar stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get seminar statistics",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}