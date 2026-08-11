// src/app/api/groups/export/detailed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Group from "@/src/models/Group";
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
    const format = searchParams.get('format') || 'csv';
    const isActive = searchParams.get('isActive');

    const query: any = {};
    if (isActive !== null) query.is_active = isActive === 'true';

    const groups = await Group.find(query).sort({ name: 1 }).lean();

    // Get all attendees with their group information
    const attendeeData = [];

    for (const group of groups) {
      for (const member of group.members) {
        try {
          const attendee = await Attendee.findById(member.attendeeId).lean();
          if (attendee) {
            attendeeData.push({
              unique_id: attendee.unique_id || 'N/A',
              first_name: attendee.first_name || '',
              last_name: attendee.last_name || '',
              group_name: group.name || '',
            });
          }
        } catch (error) {
          console.error(`Error fetching attendee ${member.attendeeId}:`, error);
        }
      }
    }

    // Sort by group name, then by last name
    attendeeData.sort((a, b) => {
      if (a.group_name !== b.group_name) {
        return a.group_name.localeCompare(b.group_name);
      }
      return a.last_name.localeCompare(b.last_name);
    });

    // Ensure the data directory exists
    const dataDir = path.join(process.cwd(), 'src', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (format === 'csv') {
      const csvData = convertToSimpleCSV(attendeeData);
      const filePath = path.join(dataDir, 'groups_members.csv');
      fs.writeFileSync(filePath, csvData, 'utf-8');

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=groups_members_${new Date().toISOString().split('T')[0]}.csv`,
        },
      });
    }

    // JSON format
    const filePath = path.join(dataDir, 'groups_members.json');
    fs.writeFileSync(filePath, JSON.stringify(attendeeData, null, 2), 'utf-8');

    return NextResponse.json({
      success: true,
      message: 'Group members exported successfully',
      metadata: {
        exported_at: new Date().toISOString(),
        total_members: attendeeData.length,
        format: 'json',
        file_path: filePath,
      },
      data: attendeeData,
    });
  } catch (error) {
    console.error("Export members error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to export members",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

function convertToSimpleCSV(attendeeData: any[]): string {
  // Simple headers
  const headers = ['Unique ID', 'First Name', 'Last Name', 'Group Name'];
  
  let csv = headers.join(',') + '\n';
  
  attendeeData.forEach(attendee => {
    const row = [
      attendee.unique_id || '',
      attendee.first_name || '',
      attendee.last_name || '',
      attendee.group_name || '',
    ];
    
    // Escape fields that contain commas or quotes
    const escapedRow = row.map(field => {
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    
    csv += escapedRow.join(',') + '\n';
  });
  
  return csv;
}