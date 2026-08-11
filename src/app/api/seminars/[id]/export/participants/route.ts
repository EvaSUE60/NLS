// src/app/api/seminars/[id]/export/participants/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Seminar from "@/src/models/Seminar";
import Attendee from "@/src/models/Attendee";
import { requireRole } from "@/src/lib/auth/middleware";
import mongoose from "mongoose";

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

    const seminar = await Seminar.findById(id);
    if (!seminar) {
      return NextResponse.json(
        { success: false, error: "Seminar not found" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';
    const attended = searchParams.get('attended');

    // Get participants with their attendee details
    const participants = seminar.participants || [];
    
    // Filter by attended status if specified
    let filteredParticipants = participants;
    if (attended !== null && attended !== undefined) {
      filteredParticipants = participants.filter(
        (p: any) => p.attended === (attended === 'true')
      );
    }

    // Fetch attendee details for each participant
    const participantDetails = await Promise.all(
      filteredParticipants.map(async (p: any) => {
        try {
          // Try to find the attendee in the Attendee collection
          const attendee = await Attendee.findById(p.attendeeId);
          
          return {
            user_id: p.unique_id || p.attendeeId || '',
            name: attendee ? `${attendee.first_name || ''} ${attendee.last_name || ''}`.trim() : p.fullName || '',
            email: attendee?.email || '',
            attended: p.attended || false,
            status: p.status || 'absent',
            check_in_time: p.attendedAt || p.check_in_time || null,
            registered_at: p.registeredAt || null,
            points: p.status === 'on_time' ? 0 : p.status === 'late' ? -1 : -2,
          };
        } catch (error) {
          // If attendee not found, use the data from the participant
          return {
            user_id: p.unique_id || p.attendeeId || '',
            name: p.fullName || 'Unknown',
            email: p.email || '',
            attended: p.attended || false,
            status: p.status || 'absent',
            check_in_time: p.attendedAt || p.check_in_time || null,
            registered_at: p.registeredAt || null,
            points: p.status === 'on_time' ? 0 : p.status === 'late' ? -1 : -2,
          };
        }
      })
    );

    const total = filteredParticipants.length;
    const onTime = filteredParticipants.filter((p: any) => p.status === 'on_time').length;
    const late = filteredParticipants.filter((p: any) => p.status === 'late').length;
    const absent = filteredParticipants.filter((p: any) => p.status === 'absent').length;

    const exportData = {
      seminar: {
        id: seminar._id,
        seminar_id: seminar.seminar_id,
        name: seminar.name,
        day: seminar.day,
        date: seminar.date,
        start_time: seminar.start_time,
        end_time: seminar.end_time,
        room: seminar.room,
        building: seminar.building,
        capacity: seminar.capacity,
        on_time_start: seminar.on_time_start,
        on_time_end: seminar.on_time_end,
        late_end: seminar.late_end,
      },
      statistics: {
        total_registered: total,
        on_time: onTime,
        late: late,
        absent: absent,
        attendance_rate: total > 0 ? ((onTime + late) / total * 100).toFixed(2) : '0',
      },
      participants: participantDetails,
    };

    if (format === 'csv') {
      const csvData = convertParticipantsToCSV(exportData);
      
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=${seminar.seminar_key}_participants_${new Date().toISOString().split('T')[0]}.csv`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: exportData,
    });

  } catch (error) {
    console.error("Export seminar participants error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to export participants",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

function convertParticipantsToCSV(exportData: any): string {
  const headers = [
    'User ID',
    'Name',
    'Email',
    'Attended',
    'Status',
    'Check-in Time',
    'Registered At',
    'Points',
  ];

  let csv = headers.join(',') + '\n';
  
  exportData.participants.forEach((p: any) => {
    const row = [
      p.user_id || '',
      p.name || '',
      p.email || '',
      p.attended ? 'Yes' : 'No',
      p.status || 'absent',
      p.check_in_time ? new Date(p.check_in_time).toLocaleString() : 'N/A',
      p.registered_at ? new Date(p.registered_at).toLocaleString() : 'N/A',
      p.points || 0,
    ];
    
    const escapedRow = row.map(field => {
      if (typeof field === 'string' && (field.includes(',') || field.includes('"'))) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    });
    
    csv += escapedRow.join(',') + '\n';
  });

  return csv;
}