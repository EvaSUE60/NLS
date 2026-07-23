// src/app/api/sessions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Session from "@/src/models/Session";
import { requireRole } from "@/src/lib/auth/middleware";
import mongoose from "mongoose";

// GET - Get session details
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
        { success: false, error: "Invalid session ID" },
        { status: 400 }
      );
    }

    const session = await Session.findById(id).lean();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch session",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// PUT - Update session
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;
    const body = await request.json();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid session ID" },
        { status: 400 }
      );
    }

    // Check if session exists
    const existingSession = await Session.findById(id);
    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    // Check if updating to a day/type that already exists (exclude current session)
    if (body.day && body.type) {
      const duplicate = await Session.findOne({
        day: body.day,
        type: body.type,
        _id: { $ne: id },
      });
      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: "Duplicate session",
            message: `${body.type} session already exists for Day ${body.day}`,
          },
          { status: 409 }
        );
      }
    }

    // Update session
    const session = await Session.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Session updated successfully",
      data: session,
    });
  } catch (error) {
    console.error("Update session error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update session",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete session
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
        { success: false, error: "Invalid session ID" },
        { status: 400 }
      );
    }

    // Check if session exists
    const session = await Session.findById(id);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    // Check if session has attendees
    if (session.attendees && session.attendees.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete session with attendees",
          message: `This session has ${session.attendees.length} attendees. Remove them first or use soft delete.`,
        },
        { status: 400 }
      );
    }

    await Session.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Session "${session.name}" deleted successfully`,
      data: {
        session_id: session.session_id,
        name: session.name,
        day: session.day,
        type: session.type,
      },
    });
  } catch (error) {
    console.error("Delete session error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete session",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}