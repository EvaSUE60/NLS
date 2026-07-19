// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import User from "@/src/models/User";
import { generateAccessToken, generateRefreshToken } from "@/src/lib/auth/jwt";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find user with password
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      is_active: true 
    }).select("+password_hash +refresh_token");

    if (!user) {
      console.log("❌ User not found:", email);
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    console.log("👤 User found:", user.email);
    console.log("🔑 Checking password...");

    // Use the model's comparePassword method
    const isPasswordValid = await user.comparePassword(password);
    console.log("✅ Password valid:", isPasswordValid ? "Yes ✅" : "No ❌");

    if (!isPasswordValid) {
      console.log("❌ Password invalid for:", email);
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate tokens
    const tokenPayload = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token
    user.refresh_token = refreshToken;
    user.last_login = new Date();
    await user.save();

    const userResponse = user.toJSON();

    const response = NextResponse.json(
      {
        success: true,
        message: "Login successful",
        data: {
          user: userResponse,
          accessToken,
          refreshToken,
        },
      },
      { status: 200 }
    );

    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    const errorMessage = error instanceof Error ? error.message : "Login failed";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}