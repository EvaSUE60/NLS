// src/app/student/[nlsId]/page.tsx
'use client';

import { use } from 'react';
import { useStudent } from '@/src/hooks/useStudent';

interface StudentPageProps {
  params: Promise<{
    nlsId: string;
  }>;
}

export default function StudentPage({ params }: StudentPageProps) {
  // ✅ Use React.use() to unwrap the Promise
  const { nlsId } = use(params);

  const { data, isLoading, error, searchHistory } = useStudent(nlsId);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-xl">Loading student information...</div>
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center text-red-500">
          <h2 className="text-2xl font-bold">Error</h2>
          <p>{error instanceof Error ? error.message : 'Failed to load student data'}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Student Not Found</h2>
          <p className="mt-2 text-gray-500">No student found with ID: {nlsId}</p>
        </div>
      </div>
    );
  }

  const { student, room, group, seminars, sessions, arrival } = data;

  return (
    <div className="container mx-auto max-w-4xl p-4">
      {/* Header */}
      <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
        <h1 className="text-3xl font-bold">{student.full_name}</h1>
        <p className="text-sm opacity-80">{student.unique_id}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/20 px-3 py-1 text-sm">
            {student.gender}
          </span>
          <span className="rounded-full bg-white/20 px-3 py-1 text-sm">
            {student.region}
          </span>
          <span className="rounded-full bg-white/20 px-3 py-1 text-sm">
            {student.arrived ? '✅ Arrived' : '❌ Not Arrived'}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Info */}
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold text-gray-600">Personal Information</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Church:</span> {student.local_church}</p>
            <p><span className="text-gray-500">Campus:</span> {student.campus}</p>
            <p><span className="text-gray-500">Payment:</span> {student.payment_status}</p>
          </div>
        </div>

        {/* Room Info */}
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold text-gray-600">Room Information</h2>
          {room ? (
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Room:</span> {room.room_number}</p>
              <p><span className="text-gray-500">Bed:</span> {room.bed_number}</p>
              <p><span className="text-gray-500">Floor:</span> {room.floor}</p>
              <p><span className="text-gray-500">Building:</span> {room.building_name}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No room assigned</p>
          )}
        </div>

        {/* Group Info */}
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold text-gray-600">Group</h2>
          {group ? (
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Name:</span> {group.name}</p>
              <p><span className="text-gray-500">Code:</span> {group.group_code}</p>
              <p><span className="text-gray-500">Points:</span> {group.points}</p>
              <p><span className="text-gray-500">Members:</span> {group.member_count}/{group.max_size}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No group assigned</p>
          )}
        </div>

        {/* Seminars */}
        <div className="rounded-lg border p-4">
          <h2 className="mb-3 font-semibold text-gray-600">Seminars</h2>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-500">Registered:</span> {seminars.total_registered}</p>
            <p><span className="text-gray-500">Attended:</span> {seminars.total_attended}</p>
            {seminars.seminars.length > 0 && (
              <div className="mt-2 max-h-32 overflow-y-auto">
                {seminars.seminars.map((sem) => (
                  <div key={sem.seminar_id} className="flex items-center justify-between border-b py-1 text-xs">
                    <span>{sem.name}</span>
                    <span className={sem.attended ? 'text-green-500' : 'text-red-500'}>
                      {sem.attended ? '✅' : '❌'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sessions */}
        <div className="rounded-lg border p-4 md:col-span-2">
          <h2 className="mb-3 font-semibold text-gray-600">Sessions Attendance</h2>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="rounded-lg bg-gray-50 p-3">
              <div className="text-2xl font-bold text-blue-500">{sessions.total_sessions}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="rounded-lg bg-green-50 p-3">
              <div className="text-2xl font-bold text-green-500">{sessions.on_time}</div>
              <div className="text-xs text-gray-500">On Time</div>
            </div>
            <div className="rounded-lg bg-yellow-50 p-3">
              <div className="text-2xl font-bold text-yellow-500">{sessions.late}</div>
              <div className="text-xs text-gray-500">Late</div>
            </div>
            <div className="rounded-lg bg-red-50 p-3">
              <div className="text-2xl font-bold text-red-500">{sessions.absent}</div>
              <div className="text-xs text-gray-500">Absent</div>
            </div>
          </div>
          <div className="mt-2 text-center text-sm">
            <span className="font-medium">Attendance Rate:</span> {sessions.attendance_rate}
          </div>
        </div>

        {/* Arrival */}
        <div className="rounded-lg border p-4 md:col-span-2">
          <h2 className="mb-3 font-semibold text-gray-600">Check-in Status</h2>
          <div className="flex items-center gap-4">
            <span className={arrival.arrived ? 'text-green-500' : 'text-red-500'}>
              {arrival.arrived ? '✅ Arrived' : '❌ Not Arrived'}
            </span>
            {arrival.arrival_time && (
              <span className="text-sm text-gray-500">
                at {new Date(arrival.arrival_time).toLocaleString()}
              </span>
            )}
            {arrival.arrival_method && (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">
                {arrival.arrival_method}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}