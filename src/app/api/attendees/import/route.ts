// src/app/api/attendees/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import { requireRole } from "@/src/lib/auth/middleware";
import { generateAttendeeId } from "@/src/lib/generateId";
import attendeeData from "@/src/data/attendee.json";

interface RawAttendee {
  "First Name": string;
  "Last_Name": string;
  "Email": string;
  "Phone": string;
  "Gender": "Male" | "Female";
  "Region": string;
  "University_College": string;
  "Local_Church": string;
  "id"?: string;
}

interface RawData {
  metadata: {
    total_attendees: number;
    generated_date: string;
    id_format: string;
  };
  attendees: RawAttendee[];
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const rawData = attendeeData as RawData;
    const rawAttendees = rawData.attendees || [];

    if (rawAttendees.length === 0) {
      return NextResponse.json(
        { success: false, error: "No attendees to import" },
        { status: 400 }
      );
    }

    console.log(`📋 Found ${rawAttendees.length} attendees to import`);

    // Check for duplicates using email/phone
    const emails = rawAttendees.map(a => a.Email.toLowerCase().trim());
    const phones = rawAttendees.map(a => a.Phone.replace(/^['"]|['"]$/g, ''));

    const existingAttendees = await Attendee.find({
      $or: [
        { email: { $in: emails } },
        { phone: { $in: phones } }
      ]
    });

    const existingEmails = new Set(existingAttendees.map(a => a.email));
    const existingPhones = new Set(existingAttendees.map(a => a.phone));

    const newAttendees = rawAttendees.filter(a => {
      const email = a.Email.toLowerCase().trim();
      const phone = a.Phone.replace(/^['"]|['"]$/g, '');
      return !existingEmails.has(email) && !existingPhones.has(phone);
    });

    if (newAttendees.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All attendees already exist (checked by email/phone)",
        data: { 
          imported: 0, 
          skipped: rawAttendees.length,
          total_attendees: await Attendee.countDocuments()
        },
      });
    }

    console.log(`🆕 ${newAttendees.length} new attendees to import`);

    // Transform data - AUTO-GENERATE IDs
    const transformedAttendees = await Promise.all(
      newAttendees.map(async (raw) => {
        const phone = raw.Phone.replace(/^['"]|['"]$/g, '');
        
        // Generate a unique ID for each attendee
        const unique_id = await generateAttendeeId();
        
        return {
          unique_id,
          first_name: raw["First Name"].trim(),
          last_name: raw["Last_Name"].trim(),
          phone: phone,
          email: raw.Email.toLowerCase().trim(),
          gender: raw.Gender,
          region: raw.Region.trim(),
          local_church: raw.Local_Church.trim(),
          campus: raw.University_College.trim(),
          payment_status: "pending" as const,
          checked_in: false,
          // ✅ IMPORTANT: These fields are set to null so they don't affect existing assignments
          dorm_assignment_id: null,
          dorm_cache: {
            roomNumber: null,
            bedNumber: null,
            floor: null,
            buildingType: null,
            buildingName: null,
          },
          seminars_cache: {
            registered: [],
            attended: [],
          },
          group_id: null,
          synced_at: new Date(),
        };
      })
    );

    // Import in batches
    const batchSize = 50;
    let importedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < transformedAttendees.length; i += batchSize) {
      const batch = transformedAttendees.slice(i, i + batchSize);
      try {
        const result = await Attendee.insertMany(batch, { ordered: false });
        importedCount += result.length;
        console.log(`✅ Imported ${result.length} attendees (${i + result.length}/${transformedAttendees.length})`);
      } catch (error: any) {
        if (error.code === 11000) {
          // Handle duplicate unique_ids
          for (const attendee of batch) {
            try {
              attendee.unique_id = await generateAttendeeId();
              await Attendee.create(attendee);
              importedCount++;
            } catch (err: any) {
              if (err.code === 11000) {
                errors.push(`Duplicate unique_id for: ${attendee.first_name} ${attendee.last_name}`);
              } else {
                errors.push(`Error importing ${attendee.first_name}: ${err.message}`);
              }
            }
          }
        } else {
          errors.push(`Batch ${i / batchSize + 1} error: ${error.message}`);
        }
      }
    }

    // Get statistics - this shows total attendees (existing + new)
    const totalCount = await Attendee.countDocuments();
    const assignedCount = await Attendee.countDocuments({ 
      dorm_assignment_id: { $ne: null } 
    });
    const unassignedCount = totalCount - assignedCount;

    const stats = await Attendee.aggregate([
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return NextResponse.json({
      success: true,
      message: `Imported ${importedCount} new attendees successfully. Existing ${totalCount - importedCount} attendees unchanged.`,
      data: {
        imported: importedCount,
        total: rawAttendees.length,
        skipped: rawAttendees.length - importedCount,
        total_attendees: totalCount,
        assigned_attendees: assignedCount,
        unassigned_attendees: unassignedCount,
        errors: errors.length > 0 ? errors : undefined,
        stats: {
          total: totalCount,
          by_region: stats,
        },
      },
    });
  } catch (error) {
    console.error("Import error:", error);
    const errorMessage = error instanceof Error ? error.message : "Import failed";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// GET - Check import status
export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin", "staff"])(request);
    if (authError) return authError;

    await connectDB();

    const total = await Attendee.countDocuments();
    const assigned = await Attendee.countDocuments({ 
      dorm_assignment_id: { $ne: null } 
    });
    const unassigned = total - assigned;

    const byRegion = await Attendee.aggregate([
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total,
        assigned,
        unassigned,
        by_region: byRegion,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get stats" },
      { status: 500 }
    );
  }
}