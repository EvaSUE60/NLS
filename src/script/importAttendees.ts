// scripts/importAttendees.ts
import { connectDB, disconnectDB } from "@/src/lib/mongodb";
import Attendee from "@/src/models/Attendee";
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

async function importAttendees() {
  try {
    await connectDB();

    const rawData = attendeeData as RawData;
    const rawAttendees = rawData.attendees || [];

    console.log(`📋 Found ${rawAttendees.length} attendees to import`);

    // Transform data with all fields
    const transformedAttendees = rawAttendees.map((raw) => {
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
        dorm_cache: {
          roomNumber: null,
          bedNumber: null,
          floor: null,
          buildingType: null,
        },
        seminars_cache: {
          registered: [],
          attended: [],
        },
        group_id: null,
        synced_at: new Date(),
      };
    });

    // Clear existing attendees (optional)
    const deleteResult = await Attendee.deleteMany({});
    console.log(`🧹 Cleared ${deleteResult.deletedCount} existing attendees`);

    // Import in batches
    const batchSize = 50;
    let importedCount = 0;

    for (let i = 0; i < transformedAttendees.length; i += batchSize) {
      const batch = transformedAttendees.slice(i, i + batchSize);
      const result = await Attendee.insertMany(batch);
      importedCount += result.length;
      console.log(`✅ Imported ${result.length} attendees (${i + result.length}/${transformedAttendees.length})`);
    }

    // Show statistics
    const stats = await Attendee.aggregate([
      {
        $group: {
          _id: '$region',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const withRoom = await Attendee.countDocuments({
      'dorm_cache.roomNumber': { $exists: true, $ne: null }
    });

    console.log(`\n📊 Import Summary:`);
    console.log(`Total: ${importedCount} attendees`);
    console.log(`With Room Assignment: ${withRoom}`);
    console.log(`\nBy Region:`);
    stats.forEach((stat) => {
      console.log(`  ${stat._id}: ${stat.count}`);
    });

    await disconnectDB();
  } catch (error) {
    console.error("❌ Import failed:", error);
    await disconnectDB();
  }
}

importAttendees();