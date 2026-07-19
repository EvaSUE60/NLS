// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import User from "@/src/models/User";
import { verifyToken } from "@/src/lib/auth";

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

    if (refreshToken) {
      // Remove refresh token from user
      try {
        const decoded = verifyToken(refreshToken);
        await User.findOneAndUpdate(
          { user_id: decoded.user_id },
          { $unset: { refresh_token: 1 } }
        );
      } catch {
        // Token might be invalid, but we still want to clear the cookie
        console.log("Invalid refresh token during logout");
      }
    }

    // Clear cookie
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    response.cookies.delete("refresh_token");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    const errorMessage = error instanceof Error ? error.message : "Logout failed";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}