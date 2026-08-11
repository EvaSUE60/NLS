// src/app/api/seminars/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Seminar from "@/src/models/Seminar";
import Attendee from "@/src/models/Attendee";
import { requireRole } from "@/src/lib/auth/middleware";

export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'json';
    const day = searchParams.get('day');
    const seminarKey = searchParams.get('seminar_key');

    // Build query
    const query: any = {};
    if (day) query.day = parseInt(day);
    if (seminarKey) query.seminar_key = seminarKey;

    // Get all seminars with participants
    const seminars = await Seminar.find(query)
      .sort({ day: 1, start_time: 1 })
      .lean();

    // Format export data
    const exportData = await Promise.all(seminars.map(async (seminar) => {
      const participants = seminar.participants || [];
      const total = participants.length;
      const onTime = participants.filter((p: any) => p.status === 'on_time').length;
      const late = participants.filter((p: any) => p.status === 'late').length;
      const absent = participants.filter((p: any) => p.status === 'absent').length;
      
      const totalPoints = (onTime * 0) + (late * -1) + (absent * -2);

      // Format participant details with attendee info
      const participantDetails = await Promise.all(
        participants.map(async (p: any) => {
          try {
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

      return {
        seminar_info: {
          seminar_id: seminar.seminar_id,
          seminar_key: seminar.seminar_key,
          name: seminar.name,
          category: seminar.category || '',
          description: seminar.description || '',
          day: seminar.day,
          date: seminar.date,
          start_time: seminar.start_time,
          end_time: seminar.end_time,
          on_time_start: seminar.on_time_start,
          on_time_end: seminar.on_time_end,
          late_end: seminar.late_end,
          room: seminar.room || '',
          building: seminar.building || '',
          capacity: seminar.capacity,
          isClosed: seminar.isClosed,
          is_active: seminar.is_active,
        },
        statistics: {
          total_registered: total,
          on_time: onTime,
          late: late,
          absent: absent,
          attendance_rate: total > 0 ? ((onTime + late) / total * 100).toFixed(2) : '0',
          points_summary: {
            on_time_bonus: 0,
            late_penalty: late * -1,
            absent_penalty: absent * -2,
            total: totalPoints,
          },
        },
        participants: participantDetails,
      };
    }));

    // Export in requested format
    if (format === 'csv') {
      const csvData = convertToCSV(exportData);
      
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=seminars_export_${new Date().toISOString().split('T')[0]}.csv`,
        },
      });
    }

    // Default: JSON export
    return NextResponse.json({
      success: true,
      message: 'Export successful',
      metadata: {
        exported_at: new Date().toISOString(),
        total_seminars: exportData.length,
        format: 'json',
      },
      data: exportData,
    });

  } catch (error) {
    console.error("Export seminars error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to export seminars",
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}

// Helper function to convert JSON to CSV
function convertToCSV(exportData: any[]): string {
  if (exportData.length === 0) {
    return 'No data available';
  }

  // Create CSV headers - flattened structure for better CSV readability
  const headers = [
    'Seminar ID',
    'Seminar Key',
    'Name',
    'Category',
    'Day',
    'Date',
    'Start Time',
    'End Time',
    'Room',
    'Building',
    'Capacity',
    'Total Registered',
    'On Time',
    'Late',
    'Absent',
    'Attendance Rate (%)',
    'Total Points',
    'Participant IDs',
    'Participant Names',
    'Participant Emails',
    'Participant Statuses',
    'Participant Check-in Times',
  ];

  const rows = exportData.map(seminar => {
    const participantIds = seminar.participants.map((p: any) => p.user_id).join('; ');
    const participantNames = seminar.participants.map((p: any) => p.name).join('; ');
    const participantEmails = seminar.participants.map((p: any) => p.email).join('; ');
    const participantStatuses = seminar.participants.map((p: any) => p.status).join('; ');
    const participantCheckins = seminar.participants
      .map((p: any) => p.check_in_time ? new Date(p.check_in_time).toLocaleString() : 'N/A')
      .join('; ');

    return [
      seminar.seminar_info.seminar_id,
      seminar.seminar_info.seminar_key,
      seminar.seminar_info.name,
      seminar.seminar_info.category,
      seminar.seminar_info.day,
      seminar.seminar_info.date ? new Date(seminar.seminar_info.date).toLocaleDateString() : '',
      seminar.seminar_info.start_time,
      seminar.seminar_info.end_time,
      seminar.seminar_info.room,
      seminar.seminar_info.building,
      seminar.seminar_info.capacity,
      seminar.statistics.total_registered,
      seminar.statistics.on_time,
      seminar.statistics.late,
      seminar.statistics.absent,
      seminar.statistics.attendance_rate,
      seminar.statistics.points_summary.total,
      participantIds,
      participantNames,
      participantEmails,
      participantStatuses,
      participantCheckins,
    ];
  });

  // Build CSV string
  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    const escapedRow = row.map(field => {
      if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes(';'))) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    });
    csv += escapedRow.join(',') + '\n';
  });

  return csv;
}