// src/app/api/attendees/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import { requireRole } from "@/src/lib/auth/middleware";
import * as fs from 'fs';
import * as path from 'path';

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
      query.checked_in = checkedIn === 'true';
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

    // CSV Headers
    const csvHeaders = [
      'Unique ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Gender',
      'Region',
      'Local Church',
      'Campus'
    ];

    // Build CSV rows
    const csvRows = attendees.map(attendee => {
      const row = [
        attendee.unique_id || '',
        attendee.first_name || '',
        attendee.last_name || '',
        attendee.email || '',
        attendee.phone || '',
        attendee.gender || '',
        attendee.region || '',
        attendee.local_church || '',
        attendee.campus || '',
      ];
      
      return row.map(field => {
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
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

    // ✅ Save to src/data folder
    const dataDir = path.join(process.cwd(), 'src', 'data');
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const filePath = path.join(dataDir, filename);
    fs.writeFileSync(filePath, csvWithBOM, 'utf-8');

    console.log(`✅ CSV file saved to: ${filePath}`);
    console.log(`📊 Total attendees exported: ${attendees.length}`);

    // ✅ Return JSON response with file info (not the CSV file)
    return NextResponse.json({
      success: true,
      message: `CSV exported successfully to ${filename}`,
      data: {
        filename,
        filePath,
        totalAttendees: attendees.length,
        savedTo: filePath,
        idRange: {
          from: attendees[0]?.unique_id,
          to: attendees[attendees.length - 1]?.unique_id
        }
      }
    });

  } catch (error) {
    console.error("Export attendees error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export attendees" },
      { status: 500 }
    );
  }
}