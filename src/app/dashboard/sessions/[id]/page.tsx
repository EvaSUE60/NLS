// src/app/dashboard/sessions/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Users,
  Calendar,
  Building2,
  UserCheck,
  Loader2,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  X,
  Search,
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Avatar } from '@/src/components/ui/Avatar';
import { useSession } from '@/src/hooks/useSession';
import { useCheckin } from '@/src/hooks/useCheckin';
import { toast } from 'sonner';

interface SessionDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SessionDetailsPage({ params }: SessionDetailsPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const {
    selectedSession: session,
    isLoading,
    error,
    fetchSession,
    delete: deleteSession,
    checkIn: checkInAttendee,
    clearError,
    clearSelected,
  } = useSession();

  const { searchByNLS } = useCheckin();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [nlsIdInput, setNlsIdInput] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSession(id);
    return () => clearSelected();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${session?.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteSession(id);
      toast.success(`Session "${session?.name}" deleted successfully`);
      router.push('/dashboard/sessions');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete session');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nlsIdInput.trim()) {
      toast.error('Please enter an NLS ID');
      return;
    }

    setIsCheckingIn(true);
    try {
      // First verify the attendee exists
      await searchByNLS(nlsIdInput.trim());
      
      // Then check them in
      await checkInAttendee(id, nlsIdInput.trim(), 'manual');
      toast.success('Attendee checked in successfully');
      setShowCheckInModal(false);
      setNlsIdInput('');
      await fetchSession(id);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to check in attendee');
    } finally {
      setIsCheckingIn(false);
    }
  };

  if (isLoading && !session) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-[#0C0D0D] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
        <p className="text-rose-700 font-medium">Error: {error}</p>
        <Button
          onClick={() => { clearError(); fetchSession(id); }}
          className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-[#0C0D0D]/20 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-[#0C0D0D]">Session not found</h3>
        <Link href="/dashboard/sessions">
          <Button className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold">
            Back to Sessions
          </Button>
        </Link>
      </div>
    );
  }

  const stats = session.attendanceStats;
  const totalAttended = stats ? stats.on_time + stats.late : 0;
  const attendanceRate = stats && stats.total > 0 ? Math.round((totalAttended / stats.total) * 100) : 0;

  const filteredAttendees = session.attendees.filter((a) =>
    a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.unique_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/sessions"
            className="p-2 rounded-xl hover:bg-[#ECF4EE] transition-colors text-[#0C0D0D]/60 hover:text-[#0C0D0D]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-[#0C0D0D]">{session.name}</h1>
              <Badge variant="info" className={`text-xs font-bold px-3 py-1 rounded-xl border ${session.type === 'morning' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {session.type === 'morning' ? '🌅 Morning' : '🌤️ Afternoon'}
              </Badge>
              <Badge variant="success" className="text-xs font-bold px-3 py-1 rounded-xl bg-emerald-100 text-emerald-700 border-emerald-200">
                Day {session.day}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-[#0C0D0D]/60">
              <span>{session.start_time} - {session.end_time}</span>
              <span>•</span>
              <span>{new Date(session.date).toLocaleDateString()}</span>
              {session.building && (
                <>
                  <span>•</span>
                  <span>{session.building}{session.room ? `, ${session.room}` : ''}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowCheckInModal(true)}
            className="flex items-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            <UserPlus className="h-4 w-4" />
            Check In
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 transition-all disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Total Attendees</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{stats?.total || 0}</p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">Registered</p>
        </div>
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">On Time</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-emerald-600">{stats?.on_time || 0}</p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">Checked in on time</p>
        </div>
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Late</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-amber-600">{stats?.late || 0}</p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">Checked in late</p>
        </div>
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Attendance Rate</p>
          <p className={`mt-2 text-3xl font-black tracking-tight ${
            attendanceRate >= 80 ? 'text-emerald-600' :
            attendanceRate >= 50 ? 'text-amber-600' :
            'text-rose-600'
          }`}>
            {attendanceRate}%
          </p>
          <div className="w-full bg-[#ECF4EE] rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                attendanceRate >= 80 ? 'bg-emerald-500' :
                attendanceRate >= 50 ? 'bg-amber-500' :
                'bg-rose-500'
              }`}
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Time Windows Info */}
      <Card className="p-6 border border-[#ECF4EE]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-[#0C0D0D]">Time Windows</h3>
            <p className="text-xs text-[#0C0D0D]/60 font-medium">Attendance status based on check-in time</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-[#0C0D0D]">On Time:</span>
            <span className="text-sm text-[#0C0D0D]/60">{session.on_time_start} - {session.on_time_end}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-sm font-medium text-[#0C0D0D]">Late:</span>
            <span className="text-sm text-[#0C0D0D]/60">{session.on_time_end} - {session.late_end}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="text-sm font-medium text-[#0C0D0D]">Absent:</span>
            <span className="text-sm text-[#0C0D0D]/60">After {session.late_end}</span>
          </div>
        </div>
      </Card>

      {/* Attendees Section */}
      <Card className="p-6 border border-[#ECF4EE]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0C0D0D]">Attendees</h3>
              <p className="text-xs text-[#0C0D0D]/60 font-medium">
                {session.attendees.length} registered
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#0C0D0D]/40" />
              <input
                type="text"
                placeholder="Search attendees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-[#FAFAFA] border border-[#ECF4EE] rounded-2xl text-xs font-medium text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all"
              />
            </div>
            <button
              onClick={() => setShowCheckInModal(true)}
              className="flex items-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <UserPlus className="h-4 w-4" />
              Check In
            </button>
          </div>
        </div>

        {session.attendees.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 text-[#0C0D0D]/20 mx-auto mb-3" />
            <p className="text-sm font-medium text-[#0C0D0D]/60">No attendees checked in yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#ECF4EE] text-[#0C0D0D]/60">
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">Region</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">Check-in Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECF4EE]">
                {filteredAttendees.map((attendee, index) => (
                  <tr key={attendee.attendeeId} className="hover:bg-[#ECF4EE]/20 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-[#0C0D0D]/40">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-bold text-[#0C0D0D]">{attendee.fullName}</td>
                    <td className="px-4 py-3 text-xs text-[#0C0D0D]/60">{attendee.unique_id}</td>
                    <td className="px-4 py-3 text-xs text-[#0C0D0D]/60">{attendee.region}</td>
                    <td className="px-4 py-3">
                      {attendee.status === 'on_time' ? (
                        <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border-emerald-200">
                          <CheckCircle className="h-3 w-3 inline mr-1" />
                          On Time
                        </Badge>
                      ) : attendee.status === 'late' ? (
                        <Badge variant="warning" className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border-amber-200">
                          <AlertCircle className="h-3 w-3 inline mr-1" />
                          Late
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border-rose-200">
                          <XCircle className="h-3 w-3 inline mr-1" />
                          Absent
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#0C0D0D]/60">
                      {attendee.check_in_time ? new Date(attendee.check_in_time).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Check-in Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C0D0D]/70 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-[#0C0D0D] text-[#ECF4EE]">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#0C0D0D]">Check In Attendee</h3>
                  <p className="text-xs text-[#0C0D0D]/50 font-medium">
                    {session.name} • Day {session.day}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="p-1.5 rounded-full hover:bg-[#ECF4EE] transition-colors"
              >
                <X className="h-5 w-5 text-[#0C0D0D]/60" />
              </button>
            </div>

            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                  NLS ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={nlsIdInput}
                  onChange={(e) => setNlsIdInput(e.target.value.toUpperCase())}
                  placeholder="e.g., NLS-2026-001"
                  className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all font-mono"
                  autoFocus
                />
                <p className="text-xs text-[#0C0D0D]/40 mt-1.5">
                  Enter the attendee's NLS ID to check them in
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isCheckingIn}
                  className="flex-1 bg-[#0C0D0D] hover:bg-[#0C0D0D]/90 text-white rounded-2xl py-3 font-bold"
                >
                  {isCheckingIn ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Checking In...
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Check In
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowCheckInModal(false)}
                  className="flex-1 rounded-2xl border-[#0C0D0D]/10 bg-[#FAFAFA] text-[#0C0D0D] font-bold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}