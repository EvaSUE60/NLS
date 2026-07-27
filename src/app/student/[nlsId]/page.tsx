// src/app/student/[nlsId]/page.tsx

"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  User,
  Building2,
  Users,
  BookOpen,
  CalendarCheck,
  MapPin,
  Church,
  GraduationCap,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  BedDouble
} from "lucide-react";
import { useStudent } from "@/src/hooks/useStudent";

interface StudentPageProps {
  params: Promise<{
    nlsId: string;
  }>;
}

export default function StudentPage({ params }: StudentPageProps) {
  const { nlsId } = use(params);
  const { data, isLoading, error } = useStudent(nlsId);

  // ==================== LOADING STATE ====================
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#ECF4EE] px-5 py-12 text-[#0C0D0D]">
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white/80 border border-[#d2e5d7] p-10 shadow-sm backdrop-blur-xl text-center max-w-sm w-full">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-[#0C0D0D]/5 blur-xl animate-pulse" />
            <Loader2 className="h-10 w-10 text-[#0C0D0D] animate-spin relative z-10" />
          </div>
          <p className="mt-4 text-xs font-bold text-[#0C0D0D]/60 tracking-wider uppercase">
            Loading student information...
          </p>
        </div>
      </main>
    );
  }

  // ==================== ERROR STATE ====================
  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#ECF4EE] px-5 py-12 text-[#0C0D0D]">
        <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white/90 p-8 text-center shadow-sm backdrop-blur-xl space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <AlertCircle className="h-6 w-6" />
          </div>

          <h2 className="text-xl font-extrabold text-[#0C0D0D]">
            Unable to Load Student
          </h2>

          <p className="text-xs font-medium text-rose-600">
            {error instanceof Error ? error.message : "Failed to load student data"}
          </p>

          <Link
            href="/student"
            className="inline-flex items-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Student Lookup</span>
          </Link>
        </div>
      </main>
    );
  }

  // ==================== NOT FOUND STATE ====================
  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#ECF4EE] px-5 py-12 text-[#0C0D0D]">
        <div className="w-full max-w-md rounded-3xl border border-[#d2e5d7] bg-white/90 p-8 text-center shadow-sm backdrop-blur-xl space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
            <User className="h-6 w-6" />
          </div>

          <h2 className="text-xl font-extrabold text-[#0C0D0D]">
            Student Not Found
          </h2>

          <p className="text-xs font-medium text-[#0C0D0D]/60">
            No student found with ID: <span className="font-bold text-[#0C0D0D]">{nlsId}</span>
          </p>

          <Link
            href="/student"
            className="inline-flex items-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold transition-all shadow-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Try Another NLS ID</span>
          </Link>
        </div>
      </main>
    );
  }

  const { student, room, group, seminars, sessions, arrival } = data;

  return (
    <main className="relative min-h-screen bg-[#ECF4EE] px-4 py-8 sm:px-6 lg:px-8 text-[#0C0D0D]">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[5%] top-[5%] h-[400px] w-[400px] rounded-full bg-white/60 blur-3xl" />
        <div className="absolute bottom-[5%] right-[5%] h-[400px] w-[400px] rounded-full bg-[#0C0D0D]/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link
            href="/student"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#0C0D0D]/70 transition-all hover:-translate-x-1 hover:text-[#0C0D0D]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Student Lookup</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#0C0D0D] text-[#ECF4EE]">
            <Sparkles className="w-3 h-3 text-[#ECF4EE]" /> NLS 2026
          </span>
        </div>

        {/* ================= HERO HEADER ================= */}
        <section className="relative overflow-hidden rounded-3xl bg-white/90 border border-[#d2e5d7] p-6 sm:p-8 shadow-sm backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0C0D0D]/40">
                  Student Profile
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#0C0D0D]">
                {student.full_name}
              </h1>
              <p className="font-mono text-xs font-bold text-[#0C0D0D]/60">
                {student.unique_id}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Arrived badge */}
              <div
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-extrabold ${
                  student.arrived
                    ? "bg-emerald-100/80 text-emerald-900 border border-emerald-300"
                    : "bg-amber-100/80 text-amber-900 border border-amber-300"
                }`}
              >
                {student.arrived ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                    <span>Arrived</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-amber-700" />
                    <span>Not Arrived</span>
                  </>
                )}
              </div>

              {student.gender && (
                <span className="px-3 py-2 rounded-2xl text-xs font-bold bg-[#ECF4EE] text-[#0C0D0D] border border-[#d2e5d7]">
                  {student.gender}
                </span>
              )}

              {student.region && (
                <span className="inline-flex items-center gap-1 px-3 py-2 rounded-2xl text-xs font-bold bg-[#ECF4EE] text-[#0C0D0D] border border-[#d2e5d7]">
                  <MapPin className="h-3.5 w-3.5 text-[#0C0D0D]/60" />
                  {student.region}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ================= MAIN GRID LAYOUT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Main Info Cards */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Personal Details Grid */}
            <InfoCard title="Personal Information" icon={User}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <DetailBox
                  icon={Church}
                  label="Church"
                  value={student.local_church || "N/A"}
                />
                <DetailBox
                  icon={GraduationCap}
                  label="Campus"
                  value={student.campus || "N/A"}
                />
                <DetailBox
                  icon={CreditCard}
                  label="Payment Status"
                  value={student.payment_status || "N/A"}
                  highlight
                />
              </div>
            </InfoCard>

            {/* Room & Group Allocation (2 Columns within Left Block) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Room Card */}
              <InfoCard title="Room Allocation" icon={Building2}>
                {room ? (
                  <div className="space-y-3">
                    <InfoRow label="Building" value={room.building_name} />
                    <InfoRow label="Room Number" value={room.room_number} />
                    <InfoRow label="Floor" value={`Floor ${room.floor}`} />
                    <InfoRow label="Bed Position" value={`Bed #${room.bed_number}`} />
                  </div>
                ) : (
                  <EmptyState message="No room assigned yet" />
                )}
              </InfoCard>

              {/* Group Card */}
              <InfoCard title="Group Info" icon={Users}>
                {group ? (
                  <div className="space-y-3">
                    <InfoRow label="Group Name" value={group.name} />
                    <InfoRow label="Group Code" value={group.group_code} />
                    <InfoRow label="Points" value={group.points} />
                    <InfoRow
                      label="Capacity"
                      value={`${group.member_count} / ${group.max_size} members`}
                    />
                  </div>
                ) : (
                  <EmptyState message="No group assigned yet" />
                )}
              </InfoCard>
            </div>

            {/* Seminars Card */}
            <InfoCard title="Seminars & Workshops" icon={BookOpen}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-[#ECF4EE]/40 border border-[#d2e5d7] rounded-2xl p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#0C0D0D]/50">Registered</p>
                  <p className="text-xl font-black text-[#0C0D0D]">{seminars.total_registered}</p>
                </div>
                <div className="bg-[#ECF4EE]/40 border border-[#d2e5d7] rounded-2xl p-3 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#0C0D0D]/50">Attended</p>
                  <p className="text-xl font-black text-[#0C0D0D]">{seminars.total_attended}</p>
                </div>
              </div>

              {seminars.seminars.length > 0 ? (
                <div className="space-y-2">
                  {seminars.seminars.map((sem) => (
                    <div
                      key={sem.seminar_id}
                      className="flex items-center justify-between rounded-2xl bg-[#ECF4EE]/30 border border-[#ECF4EE] px-4 py-3 text-xs"
                    >
                      <span className="font-bold text-[#0C0D0D]">{sem.name}</span>
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          sem.attended ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {sem.attended ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Attended</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Not Attended</span>
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No seminars registered" />
              )}
            </InfoCard>

          </div>

          {/* RIGHT COLUMN: Attendance Metrics & Check-in Details */}
          <div className="space-y-6">
            
            {/* Session Attendance Card */}
            <InfoCard title="Session Attendance" icon={CalendarCheck}>
              <div className="grid grid-cols-2 gap-3">
                <MetricBox label="Total" value={sessions.total_sessions} color="text-[#0C0D0D]" />
                <MetricBox label="On Time" value={sessions.on_time} color="text-emerald-700" />
                <MetricBox label="Late" value={sessions.late} color="text-amber-700" />
                <MetricBox label="Absent" value={sessions.absent} color="text-rose-600" />
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#ECF4EE] pt-4">
                <span className="text-xs font-bold text-[#0C0D0D]/50">Overall Attendance Rate</span>
                <span className="text-sm font-black text-[#0C0D0D] bg-[#ECF4EE] border border-[#d2e5d7] px-3 py-1 rounded-full">
                  {sessions.attendance_rate}
                </span>
              </div>
            </InfoCard>

            {/* Check-in Details */}
            <InfoCard title="Check-in Status" icon={Clock}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0C0D0D]/50">Status</span>
                  <span
                    className={`text-xs font-black ${
                      arrival.arrived ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {arrival.arrived ? "✓ Arrived On-Site" : "Pending Check-in"}
                  </span>
                </div>

                {arrival.arrival_time && (
                  <div className="flex items-center justify-between border-t border-[#ECF4EE] pt-3">
                    <span className="text-xs font-bold text-[#0C0D0D]/50">Check-in Time</span>
                    <span className="text-xs font-semibold text-[#0C0D0D]">
                      {new Date(arrival.arrival_time).toLocaleString()}
                    </span>
                  </div>
                )}

                {arrival.arrival_method && (
                  <div className="flex items-center justify-between border-t border-[#ECF4EE] pt-3">
                    <span className="text-xs font-bold text-[#0C0D0D]/50">Transportation</span>
                    <span className="text-xs font-bold bg-[#ECF4EE] px-3 py-1 rounded-full text-[#0C0D0D]">
                      {arrival.arrival_method}
                    </span>
                  </div>
                )}
              </div>
            </InfoCard>

          </div>

        </div>
      </div>
    </main>
  );
}

/* =====================================================
   REUSABLE UI COMPONENTS
===================================================== */

function InfoCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-[#d2e5d7] bg-white/90 p-6 shadow-sm backdrop-blur-xl">
      <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-[#ECF4EE]">
        <div className="p-2 bg-[#ECF4EE] rounded-xl text-[#0C0D0D]">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-extrabold text-[#0C0D0D] uppercase tracking-wider">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function DetailBox({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 border ${
        highlight
          ? "bg-[#0C0D0D] text-[#ECF4EE] border-[#0C0D0D]"
          : "bg-[#ECF4EE]/30 border-[#ECF4EE] text-[#0C0D0D]"
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5 opacity-70">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xs font-extrabold truncate">{value}</p>
    </div>
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
    <div className="flex items-center justify-between py-1.5 border-b border-[#ECF4EE] text-xs">
      <span className="font-semibold text-[#0C0D0D]/50">{label}</span>
      <span className="font-bold text-[#0C0D0D]">{value}</span>
    </div>
  );
}

function MetricBox({
  label,
  value,
  color,
}: {
  label: string;
  value: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-[#ECF4EE]/30 border border-[#ECF4EE] rounded-2xl p-3 text-center">
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#0C0D0D]/50 mt-1">
        {label}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-xs font-semibold text-[#0C0D0D]/40 text-center py-4 bg-[#ECF4EE]/20 rounded-2xl border border-dashed border-[#d2e5d7]">
      {message}
    </p>
  );
}