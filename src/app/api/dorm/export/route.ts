// src/app/api/dorm/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Building from "@/src/models/Building";
import Room from "@/src/models/Room";
import Attendee from "@/src/models/Attendee";
import DormAssignment from "@/src/models/DormAssignment";
import { requireRole } from "@/src/lib/auth/middleware";

export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const buildingType = searchParams.get('type') || 'all';
    const buildingId = searchParams.get('buildingId') || '';

    // Build query for buildings
    const buildingQuery: any = { is_active: true };
    if (buildingType !== 'all') buildingQuery.type = buildingType;
    if (buildingId) buildingQuery._id = buildingId;

    const buildings = await Building.find(buildingQuery).lean();
    const buildingIds = buildings.map(b => b._id);

    // Get rooms for these buildings
    const roomQuery: any = { is_active: true };
    if (buildingIds.length > 0) {
      roomQuery.building_id = { $in: buildingIds };
    }

    const rooms = await Room.find(roomQuery).lean();

    // Get assignments for these rooms
    const roomIds = rooms.map(r => r._id);
    const assignments = await DormAssignment.find({
      room_id: { $in: roomIds },
      status: 'active'
    }).lean();

    // Get attendees for these assignments
    const attendeeIds = assignments.map(a => a.attendee_id);
    const attendees = await Attendee.find({
      _id: { $in: attendeeIds }
    }).lean();

    // Build a map for quick lookups
    const roomMap = new Map();
    rooms.forEach(room => {
      roomMap.set(room._id.toString(), room);
    });

    const buildingMap = new Map();
    buildings.forEach(building => {
      buildingMap.set(building._id.toString(), building);
    });

    const attendeeMap = new Map();
    attendees.forEach(attendee => {
      attendeeMap.set(attendee._id.toString(), attendee);
    });

    // ==================== BUILDING SUMMARY CSV ====================
    const buildingHeaders = [
      'Building Name',
      'Type',
      'Floors',
      'Total Rooms',
      'Occupied Rooms',
      'Available Rooms',
      'Total Beds',
      'Occupied Beds',
      'Available Beds',
      'Occupancy Rate (%)',
      'Status'
    ];

    const buildingRows = buildings.map(building => {
      const buildingRooms = rooms.filter(r => r.building_id.toString() === building._id.toString());
      const totalRooms = buildingRooms.length;
      const occupiedRooms = buildingRooms.filter(r => r.is_full).length;
      const availableRooms = totalRooms - occupiedRooms;
      const totalBeds = buildingRooms.reduce((sum, r) => sum + r.capacity, 0);
      const occupiedBeds = buildingRooms.reduce((sum, r) => sum + r.current_occupancy, 0);
      const availableBeds = totalBeds - occupiedBeds;
      const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

      return [
        building.name || '',
        building.type || '',
        building.floors || 0,
        totalRooms,
        occupiedRooms,
        availableRooms,
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate.toFixed(1),
        building.is_active ? 'Active' : 'Inactive'
      ];
    });

    // ==================== ROOM DETAILS CSV ====================
    const roomHeaders = [
      'Building',
      'Type',
      'Floor',
      'Room Number',
      'Capacity',
      'Current Occupancy',
      'Available Beds',
      'Status',
      'Occupants (Names)',
      'Bed Numbers',
      'Check-in Status'
    ];

    const roomRows = rooms.map(room => {
      const building = buildingMap.get(room.building_id.toString());
      const roomAssignments = assignments.filter(a => a.room_id.toString() === room._id.toString());
      const occupants = roomAssignments.map(a => {
        const attendee = attendeeMap.get(a.attendee_id.toString());
        return attendee ? `${attendee.first_name} ${attendee.last_name}` : 'Unknown';
      });
      
      const bedNumbers = roomAssignments.map(a => a.bed_number).sort((a, b) => a - b);

      return [
        building?.name || 'Unknown',
        building?.type || 'Unknown',
        room.floor_name || room.floor || '',
        room.room_number || '',
        room.capacity || 0,
        room.current_occupancy || 0,
        (room.capacity || 0) - (room.current_occupancy || 0),
        room.is_full ? 'Full' : 'Available',
        occupants.join('; ') || 'None',
        bedNumbers.join(', ') || 'None',
        room.check_in_status || 'empty'
      ];
    });

    // ==================== ASSIGNMENT DETAILS CSV ====================
    const assignmentHeaders = [
      'Attendee Name',
      'Unique ID',
      'Gender',
      'Region',
      'Building',
      'Room Number',
      'Bed Number',
      'Floor',
      'Assigned At',
      'Status'
    ];

    const assignmentRows = assignments.map(assignment => {
      const attendee = attendeeMap.get(assignment.attendee_id.toString());
      const room = roomMap.get(assignment.room_id.toString());
      const building = buildingMap.get(assignment.building_id.toString());

      return [
        attendee ? `${attendee.first_name} ${attendee.last_name}` : 'Unknown',
        attendee?.unique_id || 'Unknown',
        attendee?.gender || 'Unknown',
        attendee?.region || 'Unknown',
        building?.name || 'Unknown',
        room?.room_number || 'Unknown',
        assignment.bed_number || '',
        room?.floor_name || 'Unknown',
        assignment.assigned_at ? new Date(assignment.assigned_at).toLocaleString() : '',
        assignment.status || 'active'
      ];
    });

    // ==================== BUILD CSV CONTENT ====================
    const BOM = '\uFEFF';

    // Helper to escape CSV fields
    const escapeField = (field: any) => {
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    const buildCSV = (headers: string[], rows: any[][]) => {
      const headerLine = headers.map(h => escapeField(h)).join(',');
      const rowLines = rows.map(row => row.map(f => escapeField(f)).join(','));
      return [headerLine, ...rowLines].join('\n');
    };

    // ==================== CREATE MULTI-SHEET CSV ====================
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `dorm_stats_export_${timestamp}.csv`;

    // Build the complete CSV with sections
    const sections = [
      { title: 'BUILDING SUMMARY', headers: buildingHeaders, rows: buildingRows },
      { title: 'ROOM DETAILS', headers: roomHeaders, rows: roomRows },
      { title: 'ASSIGNMENT DETAILS', headers: assignmentHeaders, rows: assignmentRows }
    ];

    // Add a summary header
    let fullCSV = BOM;
    fullCSV += `DORMITORY STATISTICS EXPORT\n`;
    fullCSV += `Generated: ${new Date().toLocaleString()}\n`;
    fullCSV += `Total Buildings: ${buildings.length}\n`;
    fullCSV += `Total Rooms: ${rooms.length}\n`;
    fullCSV += `Total Assignments: ${assignments.length}\n`;
    fullCSV += `${'='.repeat(50)}\n\n`;

    sections.forEach((section, index) => {
      fullCSV += `--- ${section.title} ---\n`;
      fullCSV += buildCSV(section.headers, section.rows);
      if (index < sections.length - 1) {
        fullCSV += `\n\n${'-'.repeat(50)}\n\n`;
      }
    });

    // ==================== RETURN CSV ====================
    return new NextResponse(fullCSV, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': Buffer.byteLength(fullCSV, 'utf-8').toString(),
      },
    });

  } catch (error) {
    console.error("Dorm export error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to export dorm statistics",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}