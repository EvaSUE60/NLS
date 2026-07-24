// src/app/student/[nlsId]/page.tsx

"use client";

import { use } from "react";
import Link from "next/link";
import { useStudent } from "@/src/hooks/useStudent";

interface StudentPageProps {
  params: Promise<{
    nlsId: string;
  }>;
}

export default function StudentPage({ params }: StudentPageProps) {
  const { nlsId } = use(params);

  const { data, isLoading, error } = useStudent(nlsId);

  // Loading
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#135574] text-white">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-[#ff5b68]" />

          <p className="mt-5 text-sm text-sky-100/80">
            Loading student information...
          </p>
        </div>
      </main>
    );
  }

  // Error
  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#135574] px-5 text-white">
        <div className="w-full max-w-md rounded-2xl border border-red-400/20 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mb-4 text-4xl">!</div>

          <h2 className="text-2xl font-black">
            Unable to Load Student
          </h2>

          <p className="mt-3 text-sm text-red-200">
            {error instanceof Error
              ? error.message
              : "Failed to load student data"}
          </p>

          <Link
            href="/student"
            className="mt-6 inline-block text-sm text-sky-300 hover:text-white"
          >
            ← Back to Student Lookup
          </Link>
        </div>
      </main>
    );
  }

  // Student not found
  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#135574] px-5 text-white">
        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/10 p-8 text-center shadow-2xl backdrop-blur-xl">
          <h2 className="text-2xl font-black">
            Student Not Found
          </h2>

          <p className="mt-3 text-sm text-sky-200">
            No student found with ID:
          </p>

          <p className="mt-1 font-bold text-[#ff5b68]">
            {nlsId}
          </p>

          <Link
            href="/student"
            className="mt-6 inline-block text-sm text-sky-300 hover:text-white"
          >
            ← Try another NLS ID
          </Link>
        </div>
      </main>
    );
  }

  const {
    student,
    room,
    group,
    seminars,
    sessions,
    arrival,
  } = data;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#135574] px-5 py-10 text-white">

      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-[400px] w-[400px] rounded-full bg-sky-400/10 blur-[120px]" />

        <div className="absolute -right-32 bottom-20 h-[400px] w-[400px] rounded-full bg-[#ed2529]/10 blur-[120px]" />

        <div className="absolute left-1/2 top-1/2 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/5 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">

        {/* Back */}
        <Link
          href="/student"
          className="mb-7 inline-flex items-center gap-2 text-sm text-sky-300 transition hover:-translate-x-1 hover:text-white"
        >
          ← Back to Student Lookup
        </Link>

        {/* ================= HEADER ================= */}

        <section className="rounded-2xl border border-white/15 bg-white/10 p-7 shadow-2xl backdrop-blur-xl sm:p-8">

          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">

            <div>
              <p className="mb-2 text-xs font-bold tracking-[0.3em] text-[#ff5b68]">
                NLS 2026
              </p>

              <h1 className="text-3xl font-black sm:text-4xl">
                {student.full_name}
              </h1>

              <p className="mt-2 text-sm text-sky-200/70">
                {student.unique_id}
              </p>
            </div>

            {/* Arrival badge */}
            <span
              className={`w-fit rounded-full border px-4 py-2 text-sm font-semibold ${
                student.arrived
                  ? "border-green-400/30 bg-green-400/10 text-green-300"
                  : "border-red-400/30 bg-red-400/10 text-red-300"
              }`}
            >
              {student.arrived
                ? "✓ Arrived"
                : "Not Arrived"}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">

            <Badge>
              {student.gender}
            </Badge>

            <Badge>
              {student.region}
            </Badge>

          </div>
        </section>

        {/* ================= INFORMATION ================= */}

        <div className="mt-6 grid gap-6 md:grid-cols-2">

          {/* Personal Information */}

          <InfoCard title="Personal Information">
            <InfoRow
              label="Church"
              value={student.local_church}
            />

            <InfoRow
              label="Campus"
              value={student.campus}
            />

            <InfoRow
              label="Payment"
              value={student.payment_status}
            />
          </InfoCard>

          {/* Room */}

          <InfoCard title="Room Information">
            {room ? (
              <>
                <InfoRow
                  label="Room"
                  value={room.room_number}
                />

                <InfoRow
                  label="Bed"
                  value={room.bed_number}
                />

                <InfoRow
                  label="Floor"
                  value={room.floor}
                />

                <InfoRow
                  label="Building"
                  value={room.building_name}
                />
              </>
            ) : (
              <EmptyMessage>
                No room assigned
              </EmptyMessage>
            )}
          </InfoCard>

          {/* Group */}

          <InfoCard title="Group Information">
            {group ? (
              <>
                <InfoRow
                  label="Name"
                  value={group.name}
                />

                <InfoRow
                  label="Code"
                  value={group.group_code}
                />

                <InfoRow
                  label="Points"
                  value={group.points}
                />

                <InfoRow
                  label="Members"
                  value={`${group.member_count}/${group.max_size}`}
                />
              </>
            ) : (
              <EmptyMessage>
                No group assigned
              </EmptyMessage>
            )}
          </InfoCard>

          {/* Seminar */}

          <InfoCard title="Seminars">

            <InfoRow
              label="Registered"
              value={seminars.total_registered}
            />

            <InfoRow
              label="Attended"
              value={seminars.total_attended}
            />

            {seminars.seminars.length > 0 && (
              <div className="mt-5 space-y-2">

                {seminars.seminars.map((sem) => (
                  <div
                    key={sem.seminar_id}
                    className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm"
                  >
                    <span className="text-sky-100">
                      {sem.name}
                    </span>

                    <span
                      className={
                        sem.attended
                          ? "text-green-300"
                          : "text-red-300"
                      }
                    >
                      {sem.attended
                        ? "✓ Attended"
                        : "Not attended"}
                    </span>
                  </div>
                ))}

              </div>
            )}

          </InfoCard>
        </div>

        {/* ================= ATTENDANCE ================= */}

        <section className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-6 shadow-xl backdrop-blur-xl">

          <h2 className="text-lg font-bold">
            Session Attendance
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

            <AttendanceCard
              value={sessions.total_sessions}
              label="Total"
            />

            <AttendanceCard
              value={sessions.on_time}
              label="On Time"
              valueClass="text-green-300"
            />

            <AttendanceCard
              value={sessions.late}
              label="Late"
              valueClass="text-yellow-300"
            />

            <AttendanceCard
              value={sessions.absent}
              label="Absent"
              valueClass="text-red-300"
            />

          </div>

          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">

            <span className="text-sm text-sky-200/70">
              Attendance Rate
            </span>

            <span className="font-bold text-sky-100">
              {sessions.attendance_rate}
            </span>

          </div>
        </section>

        {/* ================= ARRIVAL ================= */}

        <section className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-6 shadow-xl backdrop-blur-xl">

          <h2 className="text-lg font-bold">
            Check-in Status
          </h2>

          <div className="mt-5 flex flex-wrap items-center gap-4">

            <span
              className={
                arrival.arrived
                  ? "font-semibold text-green-300"
                  : "font-semibold text-red-300"
              }
            >
              {arrival.arrived
                ? "✓ Arrived"
                : "Not Arrived"}
            </span>

            {arrival.arrival_time && (
              <span className="text-sm text-sky-200/70">
                {new Date(
                  arrival.arrival_time
                ).toLocaleString()}
              </span>
            )}

            {arrival.arrival_method && (
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-sky-100">
                {arrival.arrival_method}
              </span>
            )}

          </div>
        </section>

      </div>
    </main>
  );
}

/* =====================================================
   SMALL REUSABLE PAGE COMPONENTS
===================================================== */

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-xl backdrop-blur-xl">

      <h2 className="mb-5 text-lg font-bold">
        {title}
      </h2>

      <div className="space-y-3">
        {children}
      </div>

    </section>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-2 text-sm">

      <span className="text-sky-200/60">
        {label}
      </span>

      <span className="text-right font-medium text-sky-50">
        {value}
      </span>

    </div>
  );
}

function Badge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-sky-100">
      {children}
    </span>
  );
}

function AttendanceCard({
  value,
  label,
  valueClass = "text-sky-100",
}: {
  value: React.ReactNode;
  label: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">

      <p className={`text-2xl font-black ${valueClass}`}>
        {value}
      </p>

      <p className="mt-1 text-xs text-sky-200/60">
        {label}
      </p>

    </div>
  );
}

function EmptyMessage({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="text-sm text-sky-200/60">
      {children}
    </p>
  );
}