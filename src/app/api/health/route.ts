import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";

export async function GET() {
  try {
    await connectDB();

    return NextResponse.json({
      success: true,
      message: "API is healthy",
      database: "connected",
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
      },
      {
        status: 500,
      }
    );
  }
}