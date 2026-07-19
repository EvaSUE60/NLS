// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import User from "@/src/models/User";
import { authMiddleware } from "@/src/lib/auth";

// Extend NextRequest to include user
interface AuthenticatedRequest extends NextRequest {
  user: {
    user_id: string;
    email: string;
    role: string;
    name: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authError = await authMiddleware(request);
    if (authError) return authError;

    // Get user data from request (set by authMiddleware)
    const userData = (request as AuthenticatedRequest).user;

    await connectDB();
    const user = await User.findOne({ 
      user_id: userData.user_id,
      is_active: true 
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user.toJSON(),
    });
  } catch (error) {
    console.error("Get user error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get user";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}