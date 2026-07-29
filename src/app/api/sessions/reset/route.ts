// src/app/api/sessions/reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import Session from "@/src/models/Session";
import { requireRole } from "@/src/lib/auth/middleware";

export async function POST(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const { confirm = false, sessionId = null } = body;

    // Safety check - require confirmation
    if (!confirm) {
      return NextResponse.json({
        success: false,
        error: "Confirmation required",
        message: "Please set confirm: true to reset session caches. This action cannot be undone!",
        warning: "This will remove ALL session cache data from attendees.",
      }, { status: 400 });
    }

    console.log("🔄 Resetting session caches...");

    // ==================== GET STATS BEFORE RESET ====================
    const beforeStats = {
      totalAttendees: await Attendee.countDocuments(),
      attendeesWithCache: await Attendee.countDocuments({
        $or: [
          { "sessions_cache.attended": { $exists: true, $ne: [] } },
          { "sessions_cache.on_time": { $exists: true, $ne: [] } },
          { "sessions_cache.late": { $exists: true, $ne: [] } },
          { "sessions_cache.absent": { $exists: true, $ne: [] } },
        ]
      }),
      totalAttended: await Attendee.aggregate([
        { $unwind: "$sessions_cache.attended" },
        { $count: "count" }
      ]).then(r => r[0]?.count || 0),
      totalOnTime: await Attendee.aggregate([
        { $unwind: "$sessions_cache.on_time" },
        { $count: "count" }
      ]).then(r => r[0]?.count || 0),
      totalLate: await Attendee.aggregate([
        { $unwind: "$sessions_cache.late" },
        { $count: "count" }
      ]).then(r => r[0]?.count || 0),
      totalAbsent: await Attendee.aggregate([
        { $unwind: "$sessions_cache.absent" },
        { $count: "count" }
      ]).then(r => r[0]?.count || 0),
    };

    console.log(`📊 Before reset:`, beforeStats);

    // ==================== BUILD UPDATE QUERY ====================
    let updateQuery: any = {
      $set: {
        "sessions_cache.attended": [],
        "sessions_cache.on_time": [],
        "sessions_cache.late": [],
        "sessions_cache.absent": [],
      }
    };

    // If specific sessionId is provided, remove only that session
    if (sessionId) {
      // Check if session exists
      const session = await Session.findOne({ session_id: sessionId });
      if (!session) {
        return NextResponse.json(
          { 
            success: false, 
            error: "Session not found",
            message: `No session found with ID: ${sessionId}`
          },
          { status: 404 }
        );
      }

      updateQuery = {
        $pull: {
          "sessions_cache.attended": sessionId,
          "sessions_cache.on_time": sessionId,
          "sessions_cache.late": sessionId,
          "sessions_cache.absent": sessionId,
        }
      };
      
      console.log(`🗑️ Removing session ${sessionId} (${session.name}) from all caches`);
    }

    // ==================== RESET ATTENDEES ====================
    const resetResult = await Attendee.updateMany({}, updateQuery);
    console.log(`👤 Reset ${resetResult.modifiedCount} attendees`);

    // ==================== GET STATS AFTER RESET ====================
    const afterStats = {
      totalAttendees: await Attendee.countDocuments(),
      attendeesWithCache: await Attendee.countDocuments({
        $or: [
          { "sessions_cache.attended": { $exists: true, $ne: [] } },
          { "sessions_cache.on_time": { $exists: true, $ne: [] } },
          { "sessions_cache.late": { $exists: true, $ne: [] } },
          { "sessions_cache.absent": { $exists: true, $ne: [] } },
        ]
      }),
      totalAttended: await Attendee.aggregate([
        { $unwind: "$sessions_cache.attended" },
        { $count: "count" }
      ]).then(r => r[0]?.count || 0),
      totalOnTime: await Attendee.aggregate([
        { $unwind: "$sessions_cache.on_time" },
        { $count: "count" }
      ]).then(r => r[0]?.count || 0),
      totalLate: await Attendee.aggregate([
        { $unwind: "$sessions_cache.late" },
        { $count: "count" }
      ]).then(r => r[0]?.count || 0),
      totalAbsent: await Attendee.aggregate([
        { $unwind: "$sessions_cache.absent" },
        { $count: "count" }
      ]).then(r => r[0]?.count || 0),
    };

    console.log(`📊 After reset:`, afterStats);

    return NextResponse.json({
      success: true,
      message: sessionId 
        ? `Session cache reset successfully for session: ${sessionId}`
        : "All session caches reset successfully",
      data: {
        before: beforeStats,
        after: afterStats,
        changes: {
          attendees_reset: resetResult.modifiedCount,
          attended_removed: beforeStats.totalAttended - afterStats.totalAttended,
          on_time_removed: beforeStats.totalOnTime - afterStats.totalOnTime,
          late_removed: beforeStats.totalLate - afterStats.totalLate,
          absent_removed: beforeStats.totalAbsent - afterStats.totalAbsent,
        },
        session_id: sessionId,
      },
    });
  } catch (error) {
    console.error("Reset sessions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to reset session caches",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// GET - Check current session cache status (preview before reset)
export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');

    const totalAttendees = await Attendee.countDocuments();
    
    // Get counts by session
    const sessionStats = await Attendee.aggregate([
      { $project: { 
          attended: "$sessions_cache.attended",
          on_time: "$sessions_cache.on_time",
          late: "$sessions_cache.late",
          absent: "$sessions_cache.absent",
        }
      },
      { $facet: {
          attended: [
            { $unwind: "$attended" },
            { $group: { _id: "$attended", count: { $sum: 1 } } },
          ],
          on_time: [
            { $unwind: "$on_time" },
            { $group: { _id: "$on_time", count: { $sum: 1 } } },
          ],
          late: [
            { $unwind: "$late" },
            { $group: { _id: "$late", count: { $sum: 1 } } },
          ],
          absent: [
            { $unwind: "$absent" },
            { $group: { _id: "$absent", count: { $sum: 1 } } },
          ],
        }
      },
    ]);

    // Get attendees with session cache
    const attendeesWithCache = await Attendee.countDocuments({
      $or: [
        { "sessions_cache.attended": { $exists: true, $ne: [] } },
        { "sessions_cache.on_time": { $exists: true, $ne: [] } },
        { "sessions_cache.late": { $exists: true, $ne: [] } },
        { "sessions_cache.absent": { $exists: true, $ne: [] } },
      ]
    });

    // Get session details if sessionId provided
    let sessionDetails = null;
    if (sessionId) {
      sessionDetails = await Session.findOne({ session_id: sessionId }).select('name day type');
    }

    // Calculate total entries
    const totalAttended = sessionStats[0]?.attended?.reduce((sum: number, s: any) => sum + s.count, 0) || 0;
    const totalOnTime = sessionStats[0]?.on_time?.reduce((sum: number, s: any) => sum + s.count, 0) || 0;
    const totalLate = sessionStats[0]?.late?.reduce((sum: number, s: any) => sum + s.count, 0) || 0;
    const totalAbsent = sessionStats[0]?.absent?.reduce((sum: number, s: any) => sum + s.count, 0) || 0;

    return NextResponse.json({
      success: true,
      data: {
        attendees: {
          total: totalAttendees,
          with_cache: attendeesWithCache,
          without_cache: totalAttendees - attendeesWithCache,
        },
        session_stats: {
          attended: totalAttended,
          on_time: totalOnTime,
          late: totalLate,
          absent: totalAbsent,
          total: totalAttended + totalOnTime + totalLate + totalAbsent,
        },
        by_session: {
          attended: sessionStats[0]?.attended || [],
          on_time: sessionStats[0]?.on_time || [],
          late: sessionStats[0]?.late || [],
          absent: sessionStats[0]?.absent || [],
        },
        session_details: sessionDetails,
        reset_ready: true,
        warning: "Resetting will remove ALL session cache data from attendees. Use POST with { confirm: true } to proceed.",
      },
    });
  } catch (error) {
    console.error("Sessions status check error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get sessions status",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}