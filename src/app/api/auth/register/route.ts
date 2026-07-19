// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import User from "@/src/models/User";
import { generateUserId } from "@/src/lib/auth";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, email, phone, password, role = "staff" } = body;

    console.log("📝 Registration attempt:", { name, email, role });

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create user - let the model's pre("save") hook handle hashing
    const user = await User.create({
      user_id: generateUserId(),
      name,
      email: email.toLowerCase(),
      phone,
      password_hash: password, // Pass plain password, model will hash it
      role,
      is_active: true,
    });

    console.log("✅ User created:", user.email);

    // Verify the password works
    const isPasswordValid = await user.comparePassword(password);
    console.log("✅ Password verification after creation:", isPasswordValid ? "Success ✅" : "Failed ❌");

    const userResponse = user.toJSON();

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        data: userResponse,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    const errorMessage = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}