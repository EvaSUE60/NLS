// src/app/dashboard/seminars/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  Plus,
  Search,
  RefreshCw,
  Download,
  Edit,
  Trash2,
  Eye,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Loader2,
  Sparkles,
  CheckCircle,
  XCircle,
  UserPlus,
  FileText,
  Zap,
  Building2,
  TrendingUp,
  Users2,
  CalendarDays,
  BarChart3,
} from 'lucide-react';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { useSeminar } from '@/src/hooks/useSeminar';
import { toast } from 'sonner';

export default function SeminarsPage() {
  const router = useRouter();
  const {
    seminars,
    isLoading,
    error,
    stats,
    fetchSeminars,
    delete: deleteSeminar, // ✅ Fixed: use 'delete' from the hook
    clearError,
    fetchStats,
  } = useSeminar();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'closed'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch seminars on mount
  useEffect(() => {
    fetchSeminars();
    fetchStats();
  }, []);

  // Filter seminars
  const filteredSeminars = seminars.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.seminar_key.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDay = selectedDay === 'all' || s.day === selectedDay;
    const matchesStatus = selectedStatus === 'all' ||
      (selectedStatus === 'active' && !s.isClosed && s.is_active) ||
      (selectedStatus === 'closed' && (s.isClosed || !s.is_active));
    return matchesSearch && matchesDay && matchesStatus;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setIsDeleting(id);
    try {
      await deleteSeminar(id); // ✅ Now using the correct function
      toast.success(`Seminar "${name}" deleted successfully`);
      fetchStats();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete seminar');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRefresh = async () => {
    try {
      await fetchSeminars();
      await fetchStats();
      toast.success('Seminars refreshed');
    } catch {
      toast.error('Failed to refresh seminars');
    }
  };

  const getDayLabel = (day: number) => {
    const labels: Record<number, string> = {
      1: 'Day 1',
      2: 'Day 2',
      3: 'Day 3',
      4: 'Day 4',
      5: 'Day 5',
    };
    return labels[day] || `Day ${day}`;
  };

  const getStatusBadge = (seminar: any) => {
    if (!seminar) return null;
    if (!seminar.is_active) {
      return <Badge variant="danger" className="text-[10px] font-bold px-2 py-0.5 rounded-lg">Inactive</Badge>;
    }
    if (seminar.isClosed) {
      return <Badge variant="warning" className="text-[10px] font-bold px-2 py-0.5 rounded-lg">Closed</Badge>;
    }
    const registeredCount = seminar.participants?.length || 0;
    const capacity = seminar.capacity || 0;
    if (registeredCount >= capacity) {
      return <Badge variant="info" className="text-[10px] font-bold px-2 py-0.5 rounded-lg">Full</Badge>;
    }
    return <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5 rounded-lg">Open</Badge>;
  };

  const getOccupancyColor = (registered: number, capacity: number) => {
    const rate = capacity > 0 ? (registered / capacity) * 100 : 0;
    if (rate >= 90) return 'text-rose-600';
    if (rate >= 70) return 'text-amber-600';
    return 'text-emerald-600';
  };

  const getProgressColor = (registered: number, capacity: number) => {
    const rate = capacity > 0 ? (registered / capacity) * 100 : 0;
    if (rate >= 90) return 'bg-rose-500';
    if (rate >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  if (isLoading && seminars.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-3xl bg-[#ECF4EE]/40 border border-[#ECF4EE] text-[#0C0D0D]">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#0C0D0D]/5 blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 text-[#0C0D0D] animate-spin relative z-10" />
        </div>
        <p className="mt-4 text-xs font-bold text-[#0C0D0D]/60 tracking-wider uppercase">
          Loading seminars...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
        <p className="text-rose-700 font-medium">Error loading seminars: {error}</p>
        <Button 
          onClick={() => { clearError(); fetchSeminars(); }}
          className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-2 sm:p-4">
      {/* ==================== WELCOME BANNER / HEADER ==================== */}
      <div className="relative overflow-hidden rounded-3xl bg-[#ECF4EE] border border-[#d2e5d7] p-6 sm:p-8 text-[#0C0D0D] shadow-sm">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#0C0D0D]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#0C0D0D] text-[#ECF4EE]">
                <Calendar className="w-3 h-3 text-[#ECF4EE]" /> Seminars
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0C0D0D]">
              Seminars Management
            </h1>
            <p className="text-xs sm:text-sm text-[#0C0D0D]/70 font-medium">
              Manage seminar sessions, registrations, and attendance tracking.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href="/dashboard/seminars/generate">
              <button className="flex items-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 transition-all px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs cursor-pointer">
                <Zap className="h-4 w-4" />
                Generate
              </button>
            </Link>
            <Link href="/dashboard/seminars/create">
              <button className="flex items-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 transition-all px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs cursor-pointer">
                <Plus className="h-4 w-4" />
                New Seminar
              </button>
            </Link>
            <button className="flex items-center gap-2 bg-white/80 hover:bg-white text-[#0C0D0D] border border-[#0C0D0D]/10 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer">
              <Download className="h-4 w-4 text-[#0C0D0D]/60" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* ==================== STATS CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Total Seminars</p>
            <CalendarDays className="h-4 w-4 text-[#0C0D0D]/30" />
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{stats?.summary?.total_seminars || seminars.length || 0}</p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">Sessions available</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Registrations</p>
            <UserPlus className="h-4 w-4 text-[#0C0D0D]/30" />
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">
            {seminars.reduce((sum, s) => sum + (s.participants?.length || 0), 0)}
          </p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">Total sign-ups</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Attendance</p>
            <Users2 className="h-4 w-4 text-[#0C0D0D]/30" />
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-emerald-600">
            {seminars.reduce((sum, s) => sum + (s.participants?.filter(p => p.attended).length || 0), 0)}
          </p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">Checked in</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Attendance Rate</p>
            <TrendingUp className="h-4 w-4 text-[#0C0D0D]/30" />
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-emerald-600">
            {(() => {
              const totalRegistered = seminars.reduce((sum, s) => sum + (s.participants?.length || 0), 0);
              const totalAttended = seminars.reduce((sum, s) => sum + (s.participants?.filter(p => p.attended).length || 0), 0);
              return totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0;
            })()}%
          </p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">Of registered attendees</p>
        </div>
      </div>

      {/* ==================== FILTERS & ACTIONS ==================== */}
      <div className="flex flex-col md:flex-row gap-3 flex-wrap items-center">
        <div className="flex-1 min-w-[220px] w-full relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0C0D0D]/40" />
          <input
            type="text"
            placeholder="Search seminars by name or key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#ECF4EE] focus:border-[#0C0D0D]/30 rounded-2xl text-xs font-medium text-[#0C0D0D] placeholder-[#0C0D0D]/40 focus:outline-none transition-all shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-4 py-2.5 bg-white border border-[#ECF4EE] rounded-2xl text-xs font-medium text-[#0C0D0D] focus:outline-none focus:border-[#0C0D0D]/30 shadow-2xs cursor-pointer min-w-[130px]"
          >
            <option value="all">All Days</option>
            <option value={1}>Day 1</option>
            <option value={2}>Day 2</option>
            <option value={3}>Day 3</option>
            <option value={4}>Day 4</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="px-4 py-2.5 bg-white border border-[#ECF4EE] rounded-2xl text-xs font-medium text-[#0C0D0D] focus:outline-none focus:border-[#0C0D0D]/30 shadow-2xs cursor-pointer min-w-[130px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <div className="flex border border-[#ECF4EE] bg-white rounded-2xl p-1 shadow-2xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-[#0C0D0D] text-[#ECF4EE]' 
                    : 'text-[#0C0D0D]/50 hover:text-[#0C0D0D]'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                  viewMode === 'list' 
                    ? 'bg-[#0C0D0D] text-[#ECF4EE]' 
                    : 'text-[#0C0D0D]/50 hover:text-[#0C0D0D]'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <button 
              onClick={handleRefresh}
              className="p-2.5 bg-white border border-[#ECF4EE] rounded-2xl text-[#0C0D0D]/70 hover:text-[#0C0D0D] hover:border-[#0C0D0D]/20 transition-all shadow-2xs cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ==================== SEMINARS DISPLAY ==================== */}
      {filteredSeminars.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-12 text-center">
          <Calendar className="h-12 w-12 text-[#0C0D0D]/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#0C0D0D]">No seminars found</h3>
          <p className="text-sm text-[#0C0D0D]/60 mt-1">Try adjusting your filters or create a new seminar.</p>
          <Link href="/dashboard/seminars/create">
            <Button className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold">
              <Plus className="h-4 w-4 mr-2" />
              Create Seminar
            </Button>
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSeminars.map((seminar) => (
            <div 
              key={seminar._id} 
              className="bg-white rounded-3xl border border-[#ECF4EE] shadow-xs hover:border-[#0C0D0D]/20 hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer"
              onClick={() => router.push(`/dashboard/seminars/${seminar._id}`)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[#0C0D0D] group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {seminar.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <Badge variant="info" className="text-[10px] font-bold px-2 py-0.5 rounded-lg border bg-[#ECF4EE]/70 text-[#0C0D0D]/80">
                          {seminar.seminar_key}
                        </Badge>
                        {getStatusBadge(seminar)}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/seminars/${seminar._id}`);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/seminars/${seminar._id}/edit`);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-[#0C0D0D]/60 hover:text-rose-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(seminar._id, seminar.name);
                      }}
                      disabled={isDeleting === seminar._id}
                    >
                      {isDeleting === seminar._id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Description */}
                {seminar.description && (
                  <p className="mt-3 text-xs text-[#0C0D0D]/60 font-medium line-clamp-2">
                    {seminar.description}
                  </p>
                )}

                {/* Location & Time */}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#0C0D0D]/60 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-[#0C0D0D]/40" />
                    {getDayLabel(seminar.day)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#0C0D0D]/40" />
                    {seminar.start_time} - {seminar.end_time}
                  </span>
                  {seminar.building && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-[#0C0D0D]/40" />
                      {seminar.building}{seminar.room ? `, ${seminar.room}` : ''}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-5 grid grid-cols-3 gap-2.5">
                  <div className="bg-[#ECF4EE]/50 border border-[#ECF4EE] rounded-2xl p-3 text-center">
                    <p className="text-base font-black text-[#0C0D0D]">{seminar.capacity || 0}</p>
                    <p className="text-[10px] font-bold text-[#0C0D0D]/50 uppercase tracking-wider">Capacity</p>
                  </div>
                  <div className="bg-[#ECF4EE]/50 border border-[#ECF4EE] rounded-2xl p-3 text-center">
                    <p className={`text-base font-black ${getOccupancyColor(seminar.participants?.length || 0, seminar.capacity || 1)}`}>
                      {seminar.participants?.length || 0}
                    </p>
                    <p className="text-[10px] font-bold text-[#0C0D0D]/50 uppercase tracking-wider">Registered</p>
                  </div>
                  <div className="bg-[#ECF4EE]/50 border border-[#ECF4EE] rounded-2xl p-3 text-center">
                    <p className="text-base font-black text-emerald-600">
                      {seminar.participants?.filter(p => p.attended).length || 0}
                    </p>
                    <p className="text-[10px] font-bold text-[#0C0D0D]/50 uppercase tracking-wider">Attended</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-semibold text-[#0C0D0D]/60 mb-1.5">
                    <span>Registration</span>
                    <span className="font-bold text-[#0C0D0D]">
                      {seminar.capacity > 0 
                        ? Math.round(((seminar.participants?.length || 0) / seminar.capacity) * 100) 
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-[#ECF4EE] rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(seminar.participants?.length || 0, seminar.capacity || 1)}`}
                      style={{ 
                        width: `${seminar.capacity > 0 ? Math.round(((seminar.participants?.length || 0) / seminar.capacity) * 100) : 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-3xl border border-[#ECF4EE] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#ECF4EE] bg-[#ECF4EE]/40 text-[#0C0D0D]/60">
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Seminar</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Day</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Time</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Location</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Registration</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-black uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECF4EE]">
                {filteredSeminars.map((seminar) => (
                  <tr key={seminar._id} className="hover:bg-[#ECF4EE]/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-extrabold text-[#0C0D0D] text-sm">{seminar.name}</p>
                          <p className="text-xs text-[#0C0D0D]/50 font-medium">{seminar.seminar_key}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold text-[#0C0D0D]">{getDayLabel(seminar.day)}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-[#0C0D0D]">{seminar.start_time}</span>
                        <span className="text-[10px] text-[#0C0D0D]/50">to {seminar.end_time}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-[#0C0D0D]/70">
                        {seminar.building || 'N/A'}{seminar.room ? `, ${seminar.room}` : ''}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold">
                          {seminar.participants?.length || 0}/{seminar.capacity || 0}
                        </span>
                        <div className="w-16 bg-[#ECF4EE] rounded-full h-1.5 overflow-hidden">
                          <div 
                            className={`h-1.5 rounded-full ${getProgressColor(seminar.participants?.length || 0, seminar.capacity || 1)}`}
                            style={{ 
                              width: `${seminar.capacity > 0 ? Math.round(((seminar.participants?.length || 0) / seminar.capacity) * 100) : 0}%` 
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {getStatusBadge(seminar)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors"
                          onClick={() => router.push(`/dashboard/seminars/${seminar._id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors"
                          onClick={() => router.push(`/dashboard/seminars/${seminar._id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-[#0C0D0D]/60 hover:text-rose-600 transition-colors"
                          onClick={() => handleDelete(seminar._id, seminar.name)}
                          disabled={isDeleting === seminar._id}
                        >
                          {isDeleting === seminar._id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== PAGINATION ==================== */}
      {filteredSeminars.length > 6 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs font-semibold text-[#0C0D0D]/60">
            Showing <span className="font-bold text-[#0C0D0D]">1-{filteredSeminars.length}</span> of{' '}
            <span className="font-bold text-[#0C0D0D]">{seminars.length}</span> seminars
          </p>
          <div className="flex items-center gap-2">
            <button 
              disabled 
              className="flex items-center gap-1 px-3 py-2 bg-white border border-[#ECF4EE] rounded-xl text-xs font-bold text-[#0C0D0D]/30 opacity-60 cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-xs font-bold text-[#0C0D0D] px-2">Page 1</span>
            <button 
              className="flex items-center gap-1 px-3 py-2 bg-white border border-[#ECF4EE] hover:border-[#0C0D0D]/20 rounded-xl text-xs font-bold text-[#0C0D0D] shadow-2xs transition-all cursor-pointer"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}