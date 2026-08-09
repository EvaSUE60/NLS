// src/app/api/attendees/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import { requireRole } from "@/src/lib/auth/middleware";

export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const region = searchParams.get('region') || '';
    const gender = searchParams.get('gender') || '';
    const checkedIn = searchParams.get('checkedIn');
    const paymentStatus = searchParams.get('paymentStatus') || '';

    const query: any = {};

    if (search) {
      query.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { unique_id: { $regex: search, $options: 'i' } },
      ];
    }

    if (region) query.region = region;
    if (gender) query.gender = gender;
    if (checkedIn !== null && checkedIn !== undefined && checkedIn !== '') {
      query.arrived = checkedIn === 'true';
    }
    if (paymentStatus) query.payment_status = paymentStatus;

    const attendees = await Attendee.find(query)
      .sort({ created_at: -1 })
      .lean();

    if (attendees.length === 0) {
      return NextResponse.json(
        { success: false, error: "No attendees found to export" },
        { status: 404 }
      );
    }

    // ✅ Define CSV Headers with more fields
    const csvHeaders = [
      'Unique ID',
      'First Name',
      'Last Name',
      'Full Name',
      'Email',
      'Phone',
      'Gender',
      'Region',
      'Local Church',
      'Campus',
      'Payment Status',
      'Arrived',
      'Arrival Time',
      'Check-in Method',
      'Room Number',
      'Bed Number',
      'Building',
      'Floor',
      'Group',
      'Created At'
    ];

    // ✅ Build CSV rows with all fields
    const csvRows = attendees.map(attendee => {
      const row = [
        attendee.unique_id || '',
        attendee.first_name || '',
        attendee.last_name || '',
        `${attendee.first_name || ''} ${attendee.last_name || ''}`.trim(),
        attendee.email || '',
        attendee.phone || '',
        attendee.gender || '',
        attendee.region || '',
        attendee.local_church || '',
        attendee.campus || '',
        attendee.payment_status || 'pending',
        attendee.arrived ? 'Yes' : 'No',
        attendee.arrival_time ? new Date(attendee.arrival_time).toLocaleString() : '',
        attendee.arrival_method || '',
        attendee.dorm_cache?.roomNumber || '',
        attendee.dorm_cache?.bedNumber || '',
        attendee.dorm_cache?.buildingName || '',
        attendee.dorm_cache?.floor || '',
        attendee.group_id || '',
        attendee.created_at ? new Date(attendee.created_at).toLocaleString() : '',
      ];
      
      // ✅ Escape fields that contain commas, quotes, or newlines
      return row.map(field => {
        const stringField = String(field);
        if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      }).join(',');
    });

    // Combine headers and rows
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows
    ].join('\n');

    // Add UTF-8 BOM for Excel compatibility
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `attendees_export_${timestamp}.csv`;

    // ✅ Return CSV as downloadable file
    return new NextResponse(csvWithBOM, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(csvWithBOM, 'utf-8').toString(),
      },
    });

  } catch (error) {
    console.error("Export attendees error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to export attendees",
        message: error instanceof Error ? error.message : "Something went wrong"
      },
      { status: 500 }
    );
  }
}