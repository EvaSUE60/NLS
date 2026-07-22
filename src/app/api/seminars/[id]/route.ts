// src/app/api/seminars/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Seminar from "@/src/models/Seminar";
import { requireRole } from "@/src/lib/auth/middleware";
import mongoose from "mongoose";

// GET - Get single seminar
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid seminar ID" },
        { status: 400 }
      );
    }

    const seminar = await Seminar.findById(id).lean();

    if (!seminar) {
      return NextResponse.json(
        { success: false, error: "Seminar not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: seminar,
    });
  } catch (error) {
    console.error("Get seminar error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch seminar",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// PUT - Update seminar
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid seminar ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const seminar = await Seminar.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!seminar) {
      return NextResponse.json(
        { success: false, error: "Seminar not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Seminar updated successfully",
      data: seminar,
    });
  } catch (error) {
    console.error("Update seminar error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update seminar",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete seminar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid seminar ID" },
        { status: 400 }
      );
    }

    // Check if seminar has participants
    const seminar = await Seminar.findById(id);
    if (!seminar) {
      return NextResponse.json(
        { success: false, error: "Seminar not found" },
        { status: 404 }
      );
    }

    if (seminar.participants.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete seminar with participants",
          message: `This seminar has ${seminar.participants.length} registered participants. Remove them first.`,
        },
        { status: 400 }
      );
    }

    await Seminar.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Seminar "${seminar.name}" deleted successfully`,
    });
  } catch (error) {
    console.error("Delete seminar error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete seminar",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}