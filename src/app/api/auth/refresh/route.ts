// src/app/api/auth/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import User from "@/src/models/User";
import { generateAccessToken, verifyToken } from "@/src/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get refresh token from cookie or body
    let refreshToken = request.cookies.get("refresh_token")?.value;
    
    if (!refreshToken) {
      try {
        const body = await request.json();
        refreshToken = body.refreshToken;
      } catch {
        // Body might not exist or be invalid
      }
    }

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: "Refresh token required" },
        { status: 401 }
      );
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Find user with matching refresh token
    const user = await User.findOne({
      user_id: decoded.user_id,
      refresh_token: refreshToken,
      is_active: true,
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Generate new access token
    const tokenPayload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(tokenPayload);

    return NextResponse.json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to refresh token";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}