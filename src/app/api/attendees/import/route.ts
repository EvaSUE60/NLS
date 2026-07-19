// src/app/api/attendees/import/route.ts (Updated)
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import { requireRole } from "@/src/lib/auth/middleware";
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
  "id": string;
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

    // Check for duplicates
    const existingIds = await Attendee.find(
      { unique_id: { $in: rawAttendees.map(a => a.id) } },
      { unique_id: 1 }
    ).lean();

    const existingIdSet = new Set(existingIds.map(a => a.unique_id));
    const newAttendees = rawAttendees.filter(a => !existingIdSet.has(a.id));

    if (newAttendees.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All attendees already exist",
        data: { imported: 0, skipped: rawAttendees.length },
      });
    }

    console.log(`🆕 ${newAttendees.length} new attendees to import`);

    // Transform data with all fields
    const transformedAttendees = newAttendees.map((raw) => {
      const phone = raw.Phone.replace(/^['"]|['"]$/g, '');
      return {
        unique_id: raw.id,
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
        // Add empty dorm_cache
        dorm_cache: {
          roomNumber: null,
          bedNumber: null,
          floor: null,
          buildingType: null,
        },
        // Keep seminars_cache with empty arrays
        seminars_cache: {
          registered: [],
          attended: [],
        },
        // group_id will be added later when groups are assigned
        group_id: null,
        synced_at: new Date(),
      };
    });

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
          for (const attendee of batch) {
            try {
              await Attendee.create(attendee);
              importedCount++;
            } catch (err: any) {
              if (err.code === 11000) {
                errors.push(`Duplicate unique_id: ${attendee.unique_id}`);
              } else {
                errors.push(`Error importing ${attendee.unique_id}: ${err.message}`);
              }
            }
          }
        } else {
          errors.push(`Batch ${i / batchSize + 1} error: ${error.message}`);
        }
      }
    }

    // Get statistics
    const stats = await Attendee.aggregate([
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalCount = await Attendee.countDocuments();

    return NextResponse.json({
      success: true,
      message: `Imported ${importedCount} attendees successfully`,
      data: {
        imported: importedCount,
        total: rawAttendees.length,
        skipped: rawAttendees.length - importedCount,
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

// GET endpoint to check import status
export async function GET(request: NextRequest) {
  try {
    const authError = await requireRole(["super_admin", "admin"])(request);
    if (authError) return authError;

    await connectDB();

    const total = await Attendee.countDocuments();
    const byRegion = await Attendee.aggregate([
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
    const checkedIn = await Attendee.countDocuments({ checked_in: true });
    const byPayment = await Attendee.aggregate([
      {
        $group: {
          _id: '$payment_status',
          count: { $sum: 1 },
        },
      },
    ]);
    const withRoom = await Attendee.countDocuments({
      'dorm_cache.roomNumber': { $exists: true, $ne: null }
    });
    const withGroup = await Attendee.countDocuments({
      group_id: { $exists: true, $ne: null }
    });

    return NextResponse.json({
      success: true,
      data: {
        total,
        checked_in: checkedIn,
        check_in_rate: total > 0 ? `${((checkedIn / total) * 100).toFixed(1)}%` : '0%',
        with_room: withRoom,
        with_group: withGroup,
        by_region: byRegion,
        by_payment_status: byPayment,
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