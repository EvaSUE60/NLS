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

// DELETE - Delete seminar (force delete with participants)
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

    // Find the seminar
    const seminar = await Seminar.findById(id);
    if (!seminar) {
      return NextResponse.json(
        { success: false, error: "Seminar not found" },
        { status: 404 }
      );
    }

    const participantCount = seminar.participants?.length || 0;

    // ✅ FORCE DELETE: Remove all participants first
    if (participantCount > 0) {
      // Clear all participants
      seminar.participants = [];
      await seminar.save();
      console.log(`🗑️ Removed ${participantCount} participants from seminar "${seminar.name}"`);
    }

    // Delete the seminar
    await Seminar.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Seminar "${seminar.name}" deleted successfully${participantCount > 0 ? ` (${participantCount} participants removed)` : ''}`,
      data: {
        seminar_id: seminar.seminar_id,
        name: seminar.name,
        participants_removed: participantCount,
      },
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