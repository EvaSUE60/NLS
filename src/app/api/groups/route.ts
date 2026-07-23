// src/app/api/groups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Group from "@/src/models/Group";
import User from "@/src/models/User";
import { requireRole } from "@/src/lib/auth/middleware";
import { generateGroupId, generateGroupCode } from "@/src/lib/generateId";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  max_size: z.number().min(1).max(20).default(12),
  leader_id: z.string().optional(),
  co_leader_id: z.string().optional(),
});

// POST - Create a new group
export async function POST(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const validationResult = createGroupSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          message: validationResult.error.issues[0]?.message || "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, description, max_size, leader_id, co_leader_id } = validationResult.data;

    // Check if group name already exists
    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return NextResponse.json(
        {
          success: false,
          error: "Group exists",
          message: `Group with name "${name}" already exists`,
        },
        { status: 409 }
      );
    }

    // Generate group code from name
    const groupCode = generateGroupCode(name);

    // Check if group code already exists
    const existingCode = await Group.findOne({ group_code: groupCode });
    if (existingCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Group code exists",
          message: `Group code "${groupCode}" already exists`,
        },
        { status: 409 }
      );
    }

    const group = await Group.create({
      group_id: await generateGroupId(),
      name,
      group_code: groupCode,
      description,
      max_size,
      members: [],
      current_size: 0,
      points: 40,
      total_earned: 0,
      total_lost: 0,
      activities: [],
      region_distribution: [],
      leader_id: leader_id || null,
      co_leader_id: co_leader_id || null,
      is_active: true,
    });

    return NextResponse.json({
      success: true,
      message: `Group "${name}" created successfully`,
      data: group,
    }, { status: 201 });
  } catch (error) {
    console.error("Create group error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create group",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// GET - List all groups
export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('isActive');

    const query: any = {};
    if (isActive !== null) query.is_active = isActive === 'true';

    const groups = await Group.find(query)
      .sort({ name: 1 })
      .lean();

    // Get stats for each group
    const groupsWithStats = groups.map((group) => {
      const memberCount = group.members.length;
      return {
        ...group,
        member_count: memberCount,
        available_slots: group.max_size - memberCount,
        is_full: memberCount >= group.max_size,
      };
    });

    return NextResponse.json({
      success: true,
      data: groupsWithStats,
    });
  } catch (error) {
    console.error("Get groups error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch groups",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}