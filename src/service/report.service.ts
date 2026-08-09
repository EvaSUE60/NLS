// src/lib/services/report.service.ts
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

// ==================== Types ====================
interface AttendeeStats {
  summary?: {
    total_attendees?: number;
    arrived?: number;
    not_arrived?: number;
    arrival_rate?: string;
    recent_arrivals?: number;
  };
  by_region?: Array<{
    _id: string;
    total: number;
    arrived: number;
    not_arrived: number;
  }>;
  recent_check_ins?: Array<any>;
}

interface DormStats {
  rooms?: {
    total?: number;
    available?: number;
    occupied?: number;
    occupancy_rate?: number;
  };
  beds?: {
    total?: number;
    occupied?: number;
    available?: number;
  };
  buildings?: {
    details?: Array<{
      _id: string;
      name: string;
      type: string;
      total_rooms: number;
      total_beds: number;
      occupied_beds: number;
      occupancy_rate: number;
    }>;
  };
  attendees?: {
    by_gender?: Array<{
      _id: string;
      total: number;
      assigned: number;
      unassigned: number;
    }>;
    assigned?: number;
    unassigned?: number;
  };
}

interface GroupStats {
  summary?: {
    total_groups?: number;
    total_members?: number;
    average_size?: number;
    occupancy_rate?: number;
    full_groups?: number;
    partial_groups?: number;
    empty_groups?: number;
  };
  groups?: Array<{
    _id: string;
    name: string;
    members_count: number;
    capacity: number;
    points: number;
    is_full: boolean;
  }>;
}

interface SeminarStats {
  summary?: {
    total_seminars?: number;
    total_registrations?: number;
    total_attendance?: number;
    attendance_rate?: number;
  };
  by_day?: Array<{
    day: string;
    seminars: number;
    registrations: number;
    attendance: number;
  }>;
  top_seminars?: Array<{
    _id?: string;
    title?: string;
    name?: string;
    registrations: number;
    attendance: number;
  }>;
}

export interface ReportData {
  attendeeStats: AttendeeStats | null;
  dormStats: DormStats | null;
  groupStats: GroupStats | null;
  seminarStats: SeminarStats | null;
  generatedAt: Date;
}

// ==================== Service ====================
export class ReportService {
  private static instance: ReportService;
  private constructor() {}

  static getInstance(): ReportService {
    if (!ReportService.instance) {
      ReportService.instance = new ReportService();
    }
    return ReportService.instance;
  }

  // ==================== DOCX GENERATION ====================
  async generateDOCX(data: ReportData): Promise<Blob> {
    const totalAttendees = data.attendeeStats?.summary?.total_attendees || 0;
    const arrived = data.attendeeStats?.summary?.arrived || 0;
    const notArrived = data.attendeeStats?.summary?.not_arrived || 0;
    const arrivalRate = data.attendeeStats?.summary?.arrival_rate || '0';
    const byRegion = data.attendeeStats?.by_region || [];

    const totalRooms = data.dormStats?.rooms?.total || 0;
    const availableRooms = data.dormStats?.rooms?.available || 0;
    const occupiedRooms = data.dormStats?.rooms?.occupied || 0;
    const occupancyRate = data.dormStats?.rooms?.occupancy_rate || 0;
    const totalBeds = data.dormStats?.beds?.total || 0;
    const occupiedBeds = data.dormStats?.beds?.occupied || 0;
    const availableBeds = data.dormStats?.beds?.available || 0;

    const totalGroups = data.groupStats?.summary?.total_groups || 0;
    const totalMembers = data.groupStats?.summary?.total_members || 0;
    const avgGroupSize = data.groupStats?.summary?.average_size || 0;

    const totalSeminars = data.seminarStats?.summary?.total_seminars || 0;
    const totalRegistrations = data.seminarStats?.summary?.total_registrations || 0;
    const totalAttendance = data.seminarStats?.summary?.total_attendance || 0;
    const seminarAttendanceRate = data.seminarStats?.summary?.attendance_rate || 0;

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1000,
              bottom: 1000,
              left: 1000,
              right: 1000,
            },
          },
        },
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: 'EVENT REPORT - COMPREHENSIVE ANALYSIS',
                size: 28,
                bold: true,
                font: 'Arial',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated: ${data.generatedAt.toLocaleString()}`,
                size: 18,
                color: '666666',
                font: 'Arial',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Executive Summary
          new Paragraph({
            children: [
              new TextRun({
                text: 'EXECUTIVE SUMMARY',
                size: 24,
                bold: true,
                font: 'Arial',
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `This comprehensive report provides a detailed overview of the event's progress, covering attendee registration, check-in status, room allocation, group formation, and seminar participation. The data reflects the current state of the event as of ${data.generatedAt.toLocaleDateString()}.`,
                size: 20,
                font: 'Arial',
              }),
            ],
            spacing: { after: 200 },
          }),

          // Key Metrics Table
          new Paragraph({
            children: [
              new TextRun({
                text: 'KEY METRICS',
                size: 22,
                bold: true,
                font: 'Arial',
              }),
            ],
            spacing: { before: 200, after: 100 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: 'Metric', size: 18, bold: true })],
                      }),
                    ],
                    borders: { bottom: { style: BorderStyle.SINGLE, size: 1 } },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: 'Value', size: 18, bold: true })],
                      }),
                    ],
                    borders: { bottom: { style: BorderStyle.SINGLE, size: 1 } },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Total Registrations', size: 18 })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: String(totalAttendees), size: 18, bold: true })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Checked-in Participants', size: 18 })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${arrived} (${arrivalRate}%)`, size: 18, bold: true })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Rooms Occupied', size: 18 })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${occupiedRooms} (${occupancyRate}%)`, size: 18, bold: true })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Groups Formed', size: 18 })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: String(totalGroups), size: 18, bold: true })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: 'Seminar Sessions', size: 18 })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: `${totalSeminars} (${seminarAttendanceRate}% attendance)`, size: 18, bold: true })] })],
                  }),
                ],
              }),
            ],
          }),

          // Attendee Section
          new Paragraph({
            children: [
              new TextRun({
                text: '1. ATTENDEE REGISTRATION AND CHECK-IN',
                size: 22,
                bold: true,
                font: 'Arial',
              }),
            ],
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `A total of ${totalAttendees} participants have registered for the event. Of these, ${arrived} have successfully checked in, representing a ${arrivalRate}% check-in rate. ${notArrived} participants are yet to complete their arrival process.`,
                size: 20,
                font: 'Arial',
              }),
            ],
            spacing: { after: 200 },
          }),

          // Regional Breakdown
          ...(byRegion.length > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: 'Regional Distribution',
                  size: 20,
                  bold: true,
                  font: 'Arial',
                }),
              ],
              spacing: { before: 150, after: 100 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `The highest concentration of attendees comes from ${byRegion.slice(0, 3).map((r: any) => r._id).join(', ')} and other regions.`,
                  size: 20,
                  font: 'Arial',
                }),
              ],
              spacing: { after: 150 },
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: 'Region', size: 18, bold: true })] })],
                      borders: { bottom: { style: BorderStyle.SINGLE, size: 1 } },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: 'Total', size: 18, bold: true })] })],
                      borders: { bottom: { style: BorderStyle.SINGLE, size: 1 } },
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: 'Checked In', size: 18, bold: true })] })],
                      borders: { bottom: { style: BorderStyle.SINGLE, size: 1 } },
                    }),
                  ],
                }),
                ...byRegion.map((r: any) => new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: r._id, size: 18 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: String(r.total), size: 18 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: String(r.arrived || 0), size: 18 })] })],
                    }),
                  ],
                })),
              ],
            }),
          ] : []),

          // Accommodation Section
          new Paragraph({
            children: [
              new TextRun({
                text: '2. ACCOMMODATION AND ROOM ALLOCATION',
                size: 22,
                bold: true,
                font: 'Arial',
              }),
            ],
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `The event has ${totalRooms} rooms available, providing ${totalBeds} total beds. Currently, ${occupiedBeds} beds are occupied across ${occupiedRooms} rooms, with an overall occupancy rate of ${occupancyRate}%.`,
                size: 20,
                font: 'Arial',
              }),
            ],
            spacing: { after: 150 },
          }),
          ...(availableBeds > 0 ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: `There are ${availableBeds} beds still available across ${availableRooms} rooms, providing ample capacity for additional arrivals.`,
                  size: 20,
                  font: 'Arial',
                }),
              ],
              spacing: { after: 200 },
            }),
          ] : []),

          // Groups Section
          new Paragraph({
            children: [
              new TextRun({
                text: '3. GROUP FORMATION AND PARTICIPATION',
                size: 22,
                bold: true,
                font: 'Arial',
              }),
            ],
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${totalGroups} groups have been formed with a total membership of ${totalMembers} participants. Each group averages ${avgGroupSize} members, fostering meaningful interaction and collaboration.`,
                size: 20,
                font: 'Arial',
              }),
            ],
            spacing: { after: 200 },
          }),

          // Seminars Section
          new Paragraph({
            children: [
              new TextRun({
                text: '4. SEMINAR AND ACTIVITY PARTICIPATION',
                size: 22,
                bold: true,
                font: 'Arial',
              }),
            ],
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `${totalSeminars} seminar sessions have been organized, with ${totalRegistrations} total registrations and ${totalAttendance} recorded attendance. The overall attendance rate stands at ${seminarAttendanceRate}%, indicating strong engagement across sessions.`,
                size: 20,
                font: 'Arial',
              }),
            ],
            spacing: { after: 200 },
          }),

          // Recommendations
          new Paragraph({
            children: [
              new TextRun({
                text: '5. RECOMMENDATIONS',
                size: 22,
                bold: true,
                font: 'Arial',
              }),
            ],
            spacing: { before: 300, after: 100 },
          }),
          ...(() => {
            const recs = [];
            if (parseFloat(arrivalRate) < 50) {
              recs.push('• Accelerate check-in process to improve attendance rates');
            }
            if (occupancyRate < 70 && totalRooms > 0) {
              recs.push('• Optimize room allocation to maximize bed utilization');
            }
            if (seminarAttendanceRate < 60 && totalSeminars > 0) {
              recs.push('• Enhance seminar engagement strategies to boost attendance');
            }
            if (recs.length === 0) {
              recs.push('• All metrics are performing well. Continue current strategies.');
            }
            return recs.map(text => new Paragraph({
              children: [new TextRun({ text, size: 20, font: 'Arial' })],
              spacing: { after: 100 },
            }));
          })(),

          // Footer
          new Paragraph({
            children: [
              new TextRun({
                text: '─'.repeat(50),
                size: 18,
                color: '999999',
                font: 'Arial',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 300, after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'This report is auto-generated and reflects real-time data.',
                size: 16,
                color: '888888',
                font: 'Arial',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Report ID: ${Date.now().toString(36).toUpperCase()}`,
                size: 14,
                color: '999999',
                font: 'Arial',
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }],
    });

    return await Packer.toBlob(doc);
  }

  // ==================== DOWNLOAD FUNCTIONS ====================
  async downloadDOCX(data: ReportData, filename: string = 'event-report.docx') {
    const docxBlob = await this.generateDOCX(data);
    saveAs(docxBlob, filename);
  }
}