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
    const totalEarned = groups.reduce((sum, g) => sum + g.total_earned, 0);
    const totalLost = groups.reduce((sum, g) => sum + g.total_lost, 0);
    const totalCapacity = groups.reduce((sum, g) => sum + g.max_size, 0);
    const averagePoints = totalGroups > 0 ? totalPoints / totalGroups : 0;
    const averageSize = totalGroups > 0 ? totalMembers / totalGroups : 0;

    // Full groups count
    const fullGroups = groups.filter(g => g.members.length >= g.max_size).length;
    const emptyGroups = groups.filter(g => g.members.length === 0).length;
    const partialGroups = groups.filter(g => g.members.length > 0 && g.members.length < g.max_size).length;

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
        _id: g._id,
        name: g.name,
        group_code: g.group_code,
        points: g.points,
        member_count: g.members.length,
        max_size: g.max_size,
        total_earned: g.total_earned,
        total_lost: g.total_lost,
      }));

    // Groups by size distribution
    const sizeDistribution: Record<string, number> = {};
    for (const group of groups) {
      const size = group.members.length;
      const key = size === 0 ? '0' :
                  size <= 4 ? '1-4' :
                  size <= 8 ? '5-8' :
                  size <= 12 ? '9-12' :
                  size <= 16 ? '13-16' : '17+';
      sizeDistribution[key] = (sizeDistribution[key] || 0) + 1;
    }

    // Calculate occupancy rate
    const occupancyRate = totalCapacity > 0 ? Math.round((totalMembers / totalCapacity) * 100) : 0;

    // Points distribution
    const pointsDistribution = {
      min: groups.length > 0 ? Math.min(...groups.map(g => g.points)) : 0,
      max: groups.length > 0 ? Math.max(...groups.map(g => g.points)) : 0,
      average: Math.round(averagePoints * 10) / 10,
    };

    // Group leaders stats
    const groupsWithLeaders = groups.filter(g => g.leader_id).length;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total_groups: totalGroups,
          total_members: totalMembers,
          total_capacity: totalCapacity,
          total_points: totalPoints,
          total_earned: totalEarned,
          total_lost: totalLost,
          average_points: Math.round(averagePoints * 10) / 10,
          average_size: Math.round(averageSize * 10) / 10,
          occupancy_rate: occupancyRate,
          full_groups: fullGroups,
          empty_groups: emptyGroups,
          partial_groups: partialGroups,
        },
        region_distribution: regionStats,
        size_distribution: sizeDistribution,
        points_distribution: pointsDistribution,
        top_groups: topGroups,
        groups: groups.map(g => ({
          _id: g._id,
          name: g.name,
          group_code: g.group_code,
          member_count: g.members.length,
          max_size: g.max_size,
          points: g.points,
          total_earned: g.total_earned,
          total_lost: g.total_lost,
          is_full: g.members.length >= g.max_size,
          is_empty: g.members.length === 0,
          has_leader: !!g.leader_id,
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