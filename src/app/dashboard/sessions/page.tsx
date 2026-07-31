// src/app/dashboard/sessions/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  Grid,
  List,
  Loader2,
  Clock,
  Users,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { useSession } from '@/src/hooks/useSession';
import { toast } from 'sonner';

const DAYS = [
  { value: 1, label: 'Day 1' },
  { value: 2, label: 'Day 2' },
  { value: 3, label: 'Day 3' },
  { value: 4, label: 'Day 4' },
];

const SESSION_TYPES = [
  { value: 'morning', label: 'Morning Session' },
  { value: 'afternoon', label: 'Afternoon Session' },
];

export default function SessionsPage() {
  const router = useRouter();
  const {
    sessions,
    isLoading,
    error,
    fetchSessions,
    delete: deleteSession,
    clearError,
  } = useSession();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState<'morning' | 'afternoon' | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setIsDeleting(id);
    try {
      await deleteSession(id);
      toast.success(`Session "${name}" deleted successfully`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete session');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchSessions();
      toast.success('Sessions refreshed');
    } catch {
      toast.error('Failed to refresh sessions');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.session_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDay = selectedDay === 'all' || s.day === selectedDay;
    const matchesType = selectedType === 'all' || s.type === selectedType;
    return matchesSearch && matchesDay && matchesType;
  });

  const getStatusBadge = (session: any) => {
    if (!session.is_active) {
      return (
        <Badge variant="danger" className="text-[10px] font-bold px-2 py-0.5 rounded-lg">
          Inactive
        </Badge>
      );
    }
    const stats = session.attendanceStats;
    if (stats && stats.total > 0) {
      return (
        <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5 rounded-lg">
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="info" className="text-[10px] font-bold px-2 py-0.5 rounded-lg">
        Pending
      </Badge>
    );
  };

  const getAttendanceRate = (session: any) => {
    const stats = session.attendanceStats;
    if (!stats || stats.total === 0) return 0;
    return Math.round(((stats.on_time + stats.late) / stats.total) * 100);
  };

  const getTypeColor = (type: string) => {
    return type === 'morning'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-amber-50 text-amber-700 border-amber-200';
  };

  if (isLoading && sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-3xl bg-[#FAFAFA]">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#0C0D0D]/5 blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 text-[#0C0D0D] animate-spin relative z-10" />
        </div>
        <p className="mt-4 text-xs font-bold text-[#0C0D0D]/60 tracking-wider uppercase">
          Loading sessions...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
        <p className="text-rose-700 font-medium">Error loading sessions: {error}</p>
        <Button
          onClick={() => {
            clearError();
            fetchSessions();
          }}
          className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Calculate stats
  const totalSessions = sessions.length;
  const totalAttendees = sessions.reduce((sum, s) => sum + (s.attendanceStats?.total || 0), 0);
  const avgAttendance = totalSessions > 0 ? Math.round(totalAttendees / totalSessions) : 0;
  const activeSessions = sessions.filter((s) => s.is_active).length;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-2 sm:p-4">
      {/* ==================== HEADER ==================== */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0C0D0D] p-6 sm:p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-[#ECF4EE]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-12 w-60 h-60 bg-[#ECF4EE]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECF4EE]/15 border border-[#ECF4EE]/20 text-[#ECF4EE] text-xs font-semibold backdrop-blur-md">
              <Calendar className="w-3.5 h-3.5 text-[#ECF4EE]" /> Sessions Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Sessions Dashboard
            </h1>
            <p className="text-[#ECF4EE]/80 text-sm max-w-xl">
              Manage daily sessions and track attendance.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/dashboard/sessions/create">
              <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#ECF4EE] hover:bg-[#ECF4EE]/90 text-[#0C0D0D] font-bold shadow-lg shadow-[#ECF4EE]/10 active:scale-95 transition-all text-sm cursor-pointer">
                <Plus className="h-4 w-4 stroke-[2.5]" />
                New Session
              </button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white/10 hover:bg-white/20 text-white border-white/10 backdrop-blur-md rounded-2xl h-11 px-4 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>
        </div>
      </div>

      {/* ==================== STATS CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">
              Total Sessions
            </p>
            <Calendar className="h-4 w-4 text-[#0C0D0D]/30" />
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{totalSessions}</p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">{activeSessions} active</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">
              Total Attendance
            </p>
            <Users className="h-4 w-4 text-[#0C0D0D]/30" />
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{totalAttendees}</p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">Across all sessions</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">
              Avg Per Session
            </p>
            <TrendingUp className="h-4 w-4 text-[#0C0D0D]/30" />
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{avgAttendance}</p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">Average attendees</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">
              Morning Sessions
            </p>
            <Clock className="h-4 w-4 text-[#0C0D0D]/30" />
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">
            {sessions.filter((s) => s.type === 'morning').length}
          </p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">
            {sessions.filter((s) => s.type === 'afternoon').length} afternoon
          </p>
        </div>
      </div>

      {/* ==================== FILTERS & ACTIONS ==================== */}
      <div className="flex flex-col md:flex-row gap-3 flex-wrap items-center">
        <div className="flex-1 min-w-[220px] w-full relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0C0D0D]/40" />
          <input
            type="text"
            placeholder="Search sessions by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#ECF4EE] focus:border-[#0C0D0D]/30 rounded-2xl text-xs font-medium text-[#0C0D0D] placeholder-[#0C0D0D]/40 focus:outline-none transition-all shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedDay}
            onChange={(e) =>
              setSelectedDay(e.target.value === 'all' ? 'all' : parseInt(e.target.value))
            }
            className="px-4 py-2.5 bg-white border border-[#ECF4EE] rounded-2xl text-xs font-medium text-[#0C0D0D] focus:outline-none focus:border-[#0C0D0D]/30 shadow-2xs cursor-pointer min-w-[130px]"
          >
            <option value="all">All Days</option>
            {DAYS.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="px-4 py-2.5 bg-white border border-[#ECF4EE] rounded-2xl text-xs font-medium text-[#0C0D0D] focus:outline-none focus:border-[#0C0D0D]/30 shadow-2xs cursor-pointer min-w-[150px]"
          >
            <option value="all">All Types</option>
            {SESSION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <div className="flex border border-[#ECF4EE] bg-white rounded-2xl p-1 shadow-2xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-[#6px] p-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#0C0D0D] text-[#ECF4EE]'
                    : 'text-[#0C0D0D]/50 hover:text-[#0C0D0D]'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-[#6px] p-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#0C0D0D] text-[#ECF4EE]'
                    : 'text-[#0C0D0D]/50 hover:text-[#0C0D0D]'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== SESSIONS DISPLAY ==================== */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-12 text-center">
          <Calendar className="h-12 w-12 text-[#0C0D0D]/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#0C0D0D]">No sessions found</h3>
          <p className="text-sm text-[#0C0D0D]/60 mt-1">
            Create sessions to start tracking attendance.
          </p>
          <Link href="/dashboard/sessions/create">
            <Button className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Create Session
            </Button>
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSessions.map((session) => {
            const stats = session.attendanceStats;
            const attendanceRate = getAttendanceRate(session);

            return (
              <div
                key={session._id}
                className="bg-white rounded-3xl border border-[#ECF4EE] shadow-xs hover:border-[#0C0D0D]/20 hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer"
                onClick={() => router.push(`/dashboard/sessions/${session._id}`)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-2xl ${
                          session.type === 'morning' ? 'bg-blue-50' : 'bg-amber-50'
                        } text-[#0C0D0D]`}
                      >
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-[#0C0D0D] group-hover:text-blue-700 transition-colors">
                          {session.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <Badge
                            variant="info"
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getTypeColor(
                              session.type
                            )}`}
                          >
                            {session.type === 'morning' ? '🌅 Morning' : '🌤️ Afternoon'}
                          </Badge>
                          {getStatusBadge(session)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/sessions/${session._id}`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/sessions/${session._id}/edit`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-[#0C0D0D]/60 hover:text-rose-600 transition-colors cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(session._id, session.name);
                        }}
                        disabled={isDeleting === session._id}
                      >
                        {isDeleting === session._id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-4 space-y-2 text-xs text-[#0C0D0D]/60">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-[#0C0D0D]/40" />
                      <span>
                        Day {session.day} • {new Date(session.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-[#0C0D0D]/40" />
                      <span>
                        {session.start_time} - {session.end_time}
                      </span>
                    </div>
                    {session.building && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-[#0C0D0D]/40" />
                        <span>
                          {session.building}
                          {session.room ? `, ${session.room}` : ''}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="mt-5 grid grid-cols-3 gap-2.5">
                    <div className="bg-[#ECF4EE]/50 border border-[#ECF4EE] rounded-2xl p-3 text-center">
                      <p className="text-base font-black text-[#0C0D0D]">{stats?.total || 0}</p>
                      <p className="text-[10px] font-bold text-[#0C0D0D]/50 uppercase tracking-wider">
                        Total
                      </p>
                    </div>
                    <div className="bg-[#ECF4EE]/50 border border-[#ECF4EE] rounded-2xl p-3 text-center">
                      <p className="text-base font-black text-emerald-600">
                        {stats?.on_time || 0}
                      </p>
                      <p className="text-[10px] font-bold text-[#0C0D0D]/50 uppercase tracking-wider">
                        On Time
                      </p>
                    </div>
                    <div className="bg-[#ECF4EE]/50 border border-[#ECF4EE] rounded-2xl p-3 text-center">
                      <p className="text-base font-black text-amber-600">{stats?.late || 0}</p>
                      <p className="text-[10px] font-bold text-[#0C0D0D]/50 uppercase tracking-wider">
                        Late
                      </p>
                    </div>
                  </div>

                  {/* Attendance Progress */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-semibold text-[#0C0D0D]/60 mb-1.5">
                      <span>Attendance Rate</span>
                      <span className="font-bold text-[#0C0D0D]">{attendanceRate}%</span>
                    </div>
                    <div className="w-full bg-[#ECF4EE] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          attendanceRate >= 80
                            ? 'bg-emerald-500'
                            : attendanceRate >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${attendanceRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Time Windows */}
                  <div className="mt-4 pt-3 border-t border-[#ECF4EE]">
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-medium text-[#0C0D0D]/50">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600">
                        On-time: {session.on_time_start}-{session.on_time_end}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600">
                        Late: {session.on_time_end}-{session.late_end}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-3xl border border-[#ECF4EE] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#ECF4EE] bg-[#ECF4EE]/40 text-[#0C0D0D]/60">
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">
                    Day
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">
                    Attendees
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">
                    On Time
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">
                    Late
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-black uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECF4EE]">
                {filteredSessions.map((session) => {
                  const stats = session.attendanceStats;
                  return (
                    <tr key={session._id} className="hover:bg-[#ECF4EE]/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2.5 rounded-2xl ${
                              session.type === 'morning' ? 'bg-blue-50' : 'bg-amber-50'
                            }`}
                          >
                            <Clock className="h-4 w-4 text-[#0C0D0D]" />
                          </div>
                          <div>
                            <p className="font-extrabold text-[#0C0D0D] text-sm">{session.name}</p>
                            <p className="text-xs text-[#0C0D0D]/50 font-medium capitalize">
                              {session.type}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-[#0C0D0D]">Day {session.day}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-medium text-[#0C0D0D]">
                          {session.start_time} - {session.end_time}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-extrabold text-[#0C0D0D]">
                          {stats?.total || 0}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-extrabold text-emerald-600">
                          {stats?.on_time || 0}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-extrabold text-amber-600">
                          {stats?.late || 0}
                        </span>
                      </td>
                      <td className="px-5 py-4">{getStatusBadge(session)}</td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors cursor-pointer"
                            onClick={() => router.push(`/dashboard/sessions/${session._id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors cursor-pointer"
                            onClick={() => router.push(`/dashboard/sessions/${session._id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-xl hover:bg-rose-50 text-[#0C0D0D]/60 hover:text-rose-600 transition-colors cursor-pointer"
                            onClick={() => handleDelete(session._id, session.name)}
                            disabled={isDeleting === session._id}
                          >
                            {isDeleting === session._id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}