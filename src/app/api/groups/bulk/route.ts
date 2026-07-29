// src/app/api/groups/bulk/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Group from "@/src/models/Group";
import { requireRole } from "@/src/lib/auth/middleware";
import { generateGroupId } from "@/src/lib/generateId";
import { z } from "zod";

const bulkCreateSchema = z.object({
  count: z.number().min(1, "At least 1 group required").max(100, "Maximum 100 groups per request"),
  max_size: z.number().min(1).max(20).default(12),
  name_prefix: z.string().optional().default("Group"),
  description: z.string().optional(),
  start_from: z.number().min(1).default(1),
});

export async function POST(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const validationResult = bulkCreateSchema.safeParse(body);

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

    const { count, max_size, name_prefix, description, start_from } = validationResult.data;

    // Check existing groups with same prefix
    const existingGroups = await Group.find({
      name: { $regex: `^${name_prefix}\\s+\\d+$` }
    });

    const existingNames = new Set(existingGroups.map(g => g.name));

    // ✅ Get the last group code number
    const lastGroup = await Group.findOne({ 
      group_code: { $regex: /^G-\d+$/ }
    }).sort({ group_code: -1 });

    let lastCodeNumber = 0;
    if (lastGroup) {
      const match = lastGroup.group_code.match(/\d+$/);
      if (match) {
        lastCodeNumber = parseInt(match[0]);
      }
    }

    const createdGroups = [];
    const skippedGroups = [];

    for (let i = start_from; i < start_from + count; i++) {
      const name = `${name_prefix} ${i}`;
      
      // Skip if group already exists
      if (existingNames.has(name)) {
        skippedGroups.push(name);
        continue;
      }

      // ✅ Generate group code: G-1, G-2, G-3, ...
      let groupNumber = lastCodeNumber + (i - start_from + 1);
      let groupCode = `G-${groupNumber}`;

      // ✅ Check if group code already exists (safety check)
      let codeExists = await Group.findOne({ group_code: groupCode });
      while (codeExists) {
        groupNumber++;
        groupCode = `G-${groupNumber}`;
        codeExists = await Group.findOne({ group_code: groupCode });
      }

      const group = await Group.create({
        group_id: await generateGroupId(),
        name,
        group_code: groupCode,
        description: description || `${name_prefix} ${i}`,
        max_size: max_size,
        members: [],
        current_size: 0,
        points: 40,
        total_earned: 0,
        total_lost: 0,
        activities: [],
        region_distribution: [],
        is_active: true,
      });

      createdGroups.push({
        _id: group._id,
        name: group.name,
        group_code: group.group_code,
        max_size: group.max_size,
        created_at: group.created_at,
      });
    }

    // Get total count of groups with this prefix
    const totalGroups = await Group.countDocuments({
      name: { $regex: `^${name_prefix}` }
    });

    // Calculate total capacity
    const totalCapacity = createdGroups.length * max_size;

    return NextResponse.json({
      success: true,
      message: `Created ${createdGroups.length} groups (${skippedGroups.length} skipped)`,
      data: {
        created: createdGroups,
        skipped: skippedGroups,
        summary: {
          total_requested: count,
          created: createdGroups.length,
          skipped: skippedGroups.length,
          total_groups: totalGroups,
          total_capacity: totalCapacity,
          max_size: max_size,
        },
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Bulk create groups error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create groups",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}