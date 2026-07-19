// src/app/api/attendees/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import { requireRole } from "@/src/lib/auth/middleware";

// GET - Get single attendee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    // Remove .populate('group_id') since Group model doesn't exist yet
    const attendee = await Attendee.findById(id)
      .lean();

    if (!attendee) {
      return NextResponse.json(
        { success: false, error: "Attendee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: attendee,
    });
  } catch (error) {
    console.error("Get attendee error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch attendee" },
      { status: 500 }
    );
  }
}

// PUT - Update attendee
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

    // Check if attendee exists
    const existingAttendee = await Attendee.findById(id);
    if (!existingAttendee) {
      return NextResponse.json(
        { success: false, error: "Attendee not found" },
        { status: 404 }
      );
    }

    // If email is being updated, check for duplicates
    if (body.email && body.email !== existingAttendee.email) {
      const emailExists = await Attendee.findOne({
        email: body.email.toLowerCase(),
        _id: { $ne: id },
      });
      if (emailExists) {
        return NextResponse.json(
          { success: false, error: "Email already in use by another attendee" },
          { status: 409 }
        );
      }
    }

    // If phone is being updated, check for duplicates
    if (body.phone && body.phone !== existingAttendee.phone) {
      const phoneExists = await Attendee.findOne({
        phone: body.phone,
        _id: { $ne: id },
      });
      if (phoneExists) {
        return NextResponse.json(
          { success: false, error: "Phone number already in use by another attendee" },
          { status: 409 }
        );
      }
    }

    // Remove populate since Group model doesn't exist yet
    const updatedAttendee = await Attendee.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Attendee updated successfully",
      data: updatedAttendee,
    });
  } catch (error) {
    console.error("Update attendee error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update attendee" },
      { status: 500 }
    );
  }
}

// DELETE - Delete attendee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const { id } = await params;

    const attendee = await Attendee.findByIdAndDelete(id);

    if (!attendee) {
      return NextResponse.json(
        { success: false, error: "Attendee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Attendee deleted successfully",
      data: {
        deleted_attendee: {
          unique_id: attendee.unique_id,
          name: `${attendee.first_name} ${attendee.last_name}`,
        },
      },
    });
  } catch (error) {
    console.error("Delete attendee error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete attendee" },
      { status: 500 }
    );
  }
}