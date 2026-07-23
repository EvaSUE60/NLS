// src/app/api/groups/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Group from "@/src/models/Group";
import { requireRole } from "@/src/lib/auth/middleware";

export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const groups = await Group.find({ is_active: true });

    const totalGroups = groups.length;
    const totalMembers = groups.reduce((sum, g) => sum + g.members.length, 0);
    const totalPoints = groups.reduce((sum, g) => sum + g.points, 0);
    const averagePoints = totalGroups > 0 ? totalPoints / totalGroups : 0;

    // Group by region distribution
    const regionStats: Record<string, number> = {};
    for (const group of groups) {
      for (const regionDist of group.region_distribution || []) {
        regionStats[regionDist.region] = (regionStats[regionDist.region] || 0) + regionDist.count;
      }
    }

    // Top groups by points
    const topGroups = groups
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map(g => ({
        name: g.name,
        group_code: g.group_code,
        points: g.points,
        member_count: g.members.length,
      }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total_groups: totalGroups,
          total_members: totalMembers,
          total_points: totalPoints,
          average_points: Math.round(averagePoints * 10) / 10,
        },
        region_distribution: regionStats,
        top_groups: topGroups,
        groups: groups.map(g => ({
          _id: g._id,
          name: g.name,
          group_code: g.group_code,
          member_count: g.members.length,
          max_size: g.max_size,
          points: g.points,
          is_full: g.members.length >= g.max_size,
        })),
      },
    });
  } catch (error) {
    console.error("Group stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get group statistics",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}