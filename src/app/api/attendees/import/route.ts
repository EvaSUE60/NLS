// src/app/api/attendees/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
import { requireRole } from "@/src/lib/auth/middleware";
import attendeeData from "@/src/data/attendee.json";
import mongoose from "mongoose";

// Counter Schema for atomic ID generation
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence: { type: Number, default: 0 },
});

const Counter = mongoose.models.Counter || 
  mongoose.model('Counter', CounterSchema);

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

// Generate attendee IDs using atomic counter
async function generateAttendeeIds(count: number): Promise<string[]> {
  const year = new Date().getFullYear();
  const prefix = 'NLS';
  const counterId = `${prefix}-${year}`;
  
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { sequence: count } },
    { new: true, upsert: true, lean: true }
  );
  
  const startSequence = counter.sequence - count + 1;
  const ids: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const sequence = startSequence + i;
    const padded = String(sequence).padStart(3, '0');
    ids.push(`${prefix}-${year}-${padded}`);
  }
  
  return ids;
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

    console.log(`📋 Found ${rawAttendees.length} attendees in JSON file`);

    const totalToImport = rawAttendees.length;
    console.log(`📊 Importing all ${totalToImport} attendees`);

    // Generate unique IDs for ALL attendees
    const uniqueIds = await generateAttendeeIds(totalToImport);
    console.log(`📝 Generated IDs from ${uniqueIds[0]} to ${uniqueIds[uniqueIds.length - 1]}`);

    // Transform ALL data with sequential IDs
    const transformedAttendees = rawAttendees.map((raw, index) => {
      const phone = raw.Phone.replace(/^['"]|['"]$/g, '');
      
      return {
        unique_id: uniqueIds[index],
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
        sessions_cache: {
          attended: [],
          on_time: [],
          late: [],
          absent: []
        },
        group_id: null,
        synced_at: new Date(),
        arrived: false,
        arrival_method: "manual" as const, // ✅ Fixed: Use 'as const' for literal type
      };
    });

    // Import in batches
    const batchSize = 50;
    let importedCount = 0;
    const errors: string[] = [];
    const duplicatePhoneNumbers: string[] = [];
    const duplicateEmails: string[] = [];

    for (let i = 0; i < transformedAttendees.length; i += batchSize) {
      const batch = transformedAttendees.slice(i, i + batchSize);
      try {
        const result = await Attendee.insertMany(batch, { ordered: false });
        importedCount += result.length;
        console.log(`✅ Imported ${result.length} attendees (${i + result.length}/${transformedAttendees.length})`);
      } catch (error: any) {
        console.error(`❌ Error importing batch ${i / batchSize + 1}:`, error);
        errors.push(`Batch ${i / batchSize + 1} error: ${error.message}`);
        
        // If there's a duplicate key error, try inserting one by one
        if (error.code === 11000) {
          console.log(`🔄 Retrying batch one by one to handle duplicates...`);
          for (const attendee of batch) {
            try {
              // Generate a new unique ID for this attendee
              const newId = await generateAttendeeIds(1);
              attendee.unique_id = newId[0];
              // ✅ Ensure arrival_method is properly typed
              const attendeeData = {
                ...attendee,
                arrival_method: "manual" as const,
              };
              await Attendee.create(attendeeData);
              importedCount++;
              console.log(`✅ Imported ${attendee.first_name} ${attendee.last_name} with ID: ${attendee.unique_id}`);
            } catch (err: any) {
              if (err.code === 11000) {
                // If phone or email is duplicate, still import but log it
                const errorMsg = `Duplicate key error for: ${attendee.first_name} ${attendee.last_name} (Email: ${attendee.email}, Phone: ${attendee.phone})`;
                errors.push(errorMsg);
                console.log(`⚠️ ${errorMsg} - Skipping this attendee`);
                
                // Track duplicates
                if (err.keyPattern?.phone) {
                  duplicatePhoneNumbers.push(attendee.phone);
                }
                if (err.keyPattern?.email) {
                  duplicateEmails.push(attendee.email);
                }
              } else {
                errors.push(`Error importing ${attendee.first_name}: ${err.message}`);
              }
            }
          }
        }
      }
    }

    // Get statistics
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

    // Get ID range
    const year = new Date().getFullYear();
    const idStats = await Attendee.aggregate([
      {
        $match: {
          unique_id: { $regex: `^NLS-${year}-` }
        }
      },
      {
        $group: {
          _id: null,
          min: { $min: "$unique_id" },
          max: { $max: "$unique_id" },
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      message: `Imported ${importedCount} attendees successfully.`,
      data: {
        imported: importedCount,
        total_in_json: rawAttendees.length,
        skipped: rawAttendees.length - importedCount,
        total_in_database: totalCount,
        assigned_attendees: assignedCount,
        unassigned_attendees: unassignedCount,
        id_range: idStats.length > 0 ? {
          from: idStats[0].min,
          to: idStats[0].max,
          count: idStats[0].count
        } : null,
        duplicate_phone_numbers: duplicatePhoneNumbers.length > 0 ? {
          count: duplicatePhoneNumbers.length,
          examples: [...new Set(duplicatePhoneNumbers)].slice(0, 5)
        } : 'None',
        duplicate_emails: duplicateEmails.length > 0 ? {
          count: duplicateEmails.length,
          examples: [...new Set(duplicateEmails)].slice(0, 5)
        } : 'None',
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

    const year = new Date().getFullYear();
    const idStats = await Attendee.aggregate([
      {
        $match: {
          unique_id: { $regex: `^NLS-${year}-` }
        }
      },
      {
        $group: {
          _id: null,
          min: { $min: "$unique_id" },
          max: { $max: "$unique_id" },
          count: { $sum: 1 }
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total,
        assigned,
        unassigned,
        by_region: byRegion,
        id_range: idStats.length > 0 ? {
          from: idStats[0].min,
          to: idStats[0].max,
          count: idStats[0].count
        } : null,
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