// src/app/api/groups/auto-assign/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import Group from "@/src/models/Group";
import { requireRole } from "@/src/lib/auth/middleware";
import { generateGroupId, generateUniqueGroupCode } from "@/src/lib/generateId";

interface IRegionDistribution {
  region: string;
  count: number;
}

interface IGroupMember {
  attendeeId: string;
  unique_id: string;
  fullName: string;
  region: string;
  joinedAt: Date;
}

// Helper: Shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const { 
      groupCount = 0, 
      maxSize = 12,
      groupNames = [],
    } = body;

    // Get all attendees without groups
    const attendees = await Attendee.find({
      group_id: null,
    });

    if (attendees.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No attendees without groups to assign",
        data: { assigned: 0 },
      });
    }

    // Calculate number of groups
    let numGroups = groupCount;
    if (numGroups === 0) {
      numGroups = Math.ceil(attendees.length / maxSize);
    }

    // Create or use existing groups
    const groups = []; // ✅ Changed to const
    if (groupNames.length > 0) {
      // Use provided group names
      for (const name of groupNames) {
        const code = await generateUniqueGroupCode(name);
        let group = await Group.findOne({ name });
        if (!group) {
          group = await Group.create({
            group_id: await generateGroupId(),
            name,
            group_code: code,
            max_size: maxSize,
            members: [],
            current_size: 0,
            points: 40,
            total_earned: 0,
            total_lost: 0,
            activities: [],
            region_distribution: [],
            is_active: true,
          });
        }
        groups.push(group);
      }
    } else {
      // Create new groups with unique codes
      const groupLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      
      for (let i = 0; i < numGroups; i++) {
        const letter = groupLetters[i] || `G${i + 1}`;
        const name = `Group ${letter}`;
        const code = await generateUniqueGroupCode(name);
        
        const group = await Group.create({
          group_id: await generateGroupId(),
          name,
          group_code: code,
          max_size: maxSize,
          members: [],
          current_size: 0,
          points: 40,
          total_earned: 0,
          total_lost: 0,
          activities: [],
          region_distribution: [],
          is_active: true,
        });
        groups.push(group);
      }
    }

    // ✅ Group attendees by region with proper typing
    const byRegion = attendees.reduce<Record<string, typeof attendees>>((acc, a) => {
      const region = a.region || "Unknown";
      if (!acc[region]) acc[region] = [];
      acc[region].push(a);
      return acc;
    }, {});

    // Shuffle each region's attendees
    for (const region in byRegion) {
      byRegion[region] = shuffleArray(byRegion[region]);
    }

    // Distribute attendees across groups
    const results = [];
    let groupIndex = 0;

    for (const region in byRegion) {
      const regionAttendees = byRegion[region];

      for (const attendee of regionAttendees) {
        let assigned = false;
        let attempts = 0;
        const maxAttempts = groups.length * 3;

        while (!assigned && attempts < maxAttempts) {
          const group = groups[groupIndex % groups.length];
          
          // ✅ Check region limit with proper typing
          const regionDistribution: IRegionDistribution[] = group.region_distribution || [];
          const regionEntry = regionDistribution.find(
            (r: IRegionDistribution) => r.region === region
          );
          const regionCount = regionEntry?.count || 0;

          const slotsAvailable = group.max_size - group.members.length;

          if (regionCount < 2 && slotsAvailable > 0) {
            group.members.push({
              attendeeId: attendee._id,
              unique_id: attendee.unique_id,
              fullName: `${attendee.first_name} ${attendee.last_name}`,
              region: region,
              joinedAt: new Date(),
            });

            if (regionEntry) {
              regionEntry.count += 1;
            } else {
              group.region_distribution.push({ region, count: 1 });
            }

            group.current_size = group.members.length;
            group.points = 40;
            await group.save();

            attendee.group_id = group._id;
            await attendee.save();

            results.push({
              attendee_id: attendee._id,
              unique_id: attendee.unique_id,
              full_name: `${attendee.first_name} ${attendee.last_name}`,
              region: region,
              group: group.name,
              group_id: group.group_id,
            });

            assigned = true;
          }

          groupIndex++;
          attempts++;
        }

        if (!assigned) {
          results.push({
            attendee_id: attendee._id,
            unique_id: attendee.unique_id,
            full_name: `${attendee.first_name} ${attendee.last_name}`,
            region: region,
            status: "unassigned - no available slots",
          });
        }
      }
    }

    const assignedCount = results.filter(r => r.group).length;
    const unassignedCount = results.length - assignedCount;

    return NextResponse.json({
      success: true,
      message: `Assigned ${assignedCount} attendees to ${groups.length} groups`,
      data: {
        groups: groups.map(g => ({
          _id: g._id,
          name: g.name,
          group_code: g.group_code,
          member_count: g.members.length,
          max_size: g.max_size,
          points: g.points,
          region_distribution: g.region_distribution,
        })),
        results,
        summary: {
          total_attendees: attendees.length,
          assigned: assignedCount,
          unassigned: unassignedCount,
          groups_created: groups.length,
        },
      },
    });
  } catch (error) {
    console.error("Auto-assign groups error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to auto-assign groups",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}