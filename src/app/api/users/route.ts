// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import User from "@/src/models/User";
import { requireRole } from "@/src/lib/auth/middleware";
import { generateUserId } from "@/src/lib/generateId";
import { z } from "zod";
import bcrypt from "bcryptjs";

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["super_admin", "admin", "staff"]).default("staff"),
  is_active: z.boolean().default(true),
});

// GET: List all users
export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";

    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { user_id: { $regex: search, $options: "i" } },
      ];
    }
    if (role) query.role = role;
    if (status === "active") query.is_active = true;
    if (status === "inactive") query.is_active = false;

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password_hash -refresh_token")
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// POST: Create a new user
export async function POST(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin"])(request);
    if (authError) return authError;

    await connectDB();

    const body = await request.json();
    const validationResult = createUserSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          message: validationResult.error.issues[0]?.message || "Validation failed",
        },
        { status: 400 }
      );
    }

    const { name, email, phone, password, role, is_active } = validationResult.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User exists", message: `User with email "${email}" already exists` },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      user_id: await generateUserId(),
      name,
      email,
      phone,
      password_hash,
      role,
      is_active,
    });

    // Remove sensitive data
    const userResponse = user.toJSON();
    delete (userResponse as any).password_hash;
    delete (userResponse as any).refresh_token;

    return NextResponse.json({
      success: true,
      message: `User "${name}" created successfully`,
      data: userResponse,
    }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create user",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}