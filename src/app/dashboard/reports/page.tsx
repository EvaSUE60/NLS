// src/app/dashboard/reports/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  Building2,
  DoorOpen,
  BedDouble,
  Calendar,
  TrendingUp,
  Download,
  RefreshCw,
  Sparkles,
  Loader2,
  PieChart as PieIcon,
  BarChart3,
  MapPin,
  Church,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Printer,
  FileText,
  FileDown
} from 'lucide-react';
import { useAttendee } from '@/src/hooks/useAttendee';
import { useDormStore } from '@/src/store/dorm.store';
import { useGroupStore } from '@/src/store/group.store';
import { useSeminarStore } from '@/src/store/seminar.store';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { toast } from 'sonner';
import { ReportService } from '@/src/service/report.service';

// Chart components
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  ComposedChart
} from 'recharts';

export default function ReportsPage() {
  const { stats: attendeeStats, fetchStats: fetchAttendeeStats, isLoading: attendeeLoading } = useAttendee();
  const { stats: dormStats, isLoading: dormLoading, fetchStats: fetchDormStats } = useDormStore();
  const { stats: groupStats, isLoading: groupLoading, fetchStats: fetchGroupStats } = useGroupStore();
  const { stats: seminarStats, isLoading: seminarLoading, fetchStats: fetchSeminarStats } = useSeminarStore();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'attendees' | 'rooms' | 'groups' | 'seminars'>('overview');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isExporting, setIsExporting] = useState<'pdf' | 'docx' | null>(null);

  // Fetch all stats on mount
  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchAttendeeStats(),
        fetchDormStats(),
        fetchGroupStats(),
        fetchSeminarStats(),
      ]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to fetch report data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAllStats();
    toast.success('Reports refreshed');
  };

  // Export handlers
  const handleExportDOCX = async () => {
    setIsExporting('docx');
    try {
      const reportData = {
        attendeeStats,
        dormStats,
        groupStats,
        seminarStats,
        generatedAt: new Date(),
      };
      const reportService = ReportService.getInstance();
      const filename = `event-report-${new Date().toISOString().split('T')[0]}.docx`;
      await reportService.downloadDOCX(reportData as any, filename);
      toast.success('DOCX report exported successfully!');
    } catch (error) {
      console.error('DOCX export error:', error);
      toast.error('Failed to export DOCX');
    } finally {
      setIsExporting(null);
    }
  };

  // Extract data from stats
  const totalAttendees = attendeeStats?.summary?.total_attendees || 0;
  const arrived = attendeeStats?.summary?.arrived || 0;
  const notArrived = attendeeStats?.summary?.not_arrived || 0;
  const arrivalRate = parseFloat(attendeeStats?.summary?.arrival_rate || '0');
  const byRegion = attendeeStats?.by_region || [];
  const recentArrivals = attendeeStats?.summary?.recent_arrivals || 0;

  const totalRooms = dormStats?.rooms?.total || 0;
  const availableRooms = dormStats?.rooms?.available || 0;
  const occupiedRooms = dormStats?.rooms?.occupied || 0;
  const occupancyRate = dormStats?.rooms?.occupancy_rate || 0;
  const totalBeds = dormStats?.beds?.total || 0;
  const occupiedBeds = dormStats?.beds?.occupied || 0;
  const availableBeds = dormStats?.beds?.available || 0;
  const byGender = dormStats?.attendees?.by_gender || [];
  const assigned = dormStats?.attendees?.assigned || 0;
  const unassigned = dormStats?.attendees?.unassigned || 0;

  const totalGroups = groupStats?.summary?.total_groups || 0;
  const totalMembers = groupStats?.summary?.total_members || 0;
  const avgGroupSize = groupStats?.summary?.average_size || 0;
  const groupOccupancyRate = groupStats?.summary?.occupancy_rate || 0;
  const fullGroups = groupStats?.summary?.full_groups || 0;
  const partialGroups = groupStats?.summary?.partial_groups || 0;
  const emptyGroups = groupStats?.summary?.empty_groups || 0;

  const totalSeminars = seminarStats?.summary?.total_seminars || 0;
  const totalRegistrations = seminarStats?.summary?.total_registrations || 0;
  const totalAttendance = seminarStats?.summary?.total_attendance || 0;
  const seminarAttendanceRate = seminarStats?.summary?.attendance_rate || 0;

  // Prepare chart data
  const regionChartData = byRegion.map((r: any) => ({
    name: r._id,
    total: r.total || 0,
    arrived: r.arrived || 0,
    notArrived: r.not_arrived || 0,
  }));

  const genderChartData = byGender.map((g: any) => ({
    name: g._id || g.gender || 'Unknown',
    total: g.total || g.count || 0,
    assigned: g.assigned || 0,
    unassigned: g.unassigned || 0,
  }));

  const dormPieData = [
    { name: 'Available', value: availableRooms, color: '#10b981' },
    { name: 'Occupied', value: occupiedRooms, color: '#0C0D0D' },
  ].filter(d => d.value > 0);

  const bedPieData = [
    { name: 'Available Beds', value: availableBeds, color: '#10b981' },
    { name: 'Occupied Beds', value: occupiedBeds, color: '#0C0D0D' },
  ].filter(d => d.value > 0);

  const attendeePieData = [
    { name: 'Checked In', value: arrived, color: '#10b981' },
    { name: 'Pending', value: notArrived, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const groupPieData = [
    { name: 'Full', value: fullGroups, color: '#0C0D0D' },
    { name: 'Partial', value: partialGroups, color: '#f59e0b' },
    { name: 'Empty', value: emptyGroups, color: '#e5e7eb' },
  ].filter(d => d.value > 0);

  const COLORS = ['#0C0D0D', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0C0D0D] text-white rounded-xl p-3 shadow-xl border border-white/10">
          <p className="text-xs font-bold text-white/60 mb-1">{label}</p>
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-4 text-xs">
              <span className="text-white/60">{p.name}</span>
              <span className="font-bold text-white">{p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading && !attendeeStats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-3xl bg-[#ECF4EE]/40 border border-[#ECF4EE] text-[#0C0D0D]">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#0C0D0D]/5 blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 text-[#0C0D0D] animate-spin relative z-10" />
        </div>
        <p className="mt-4 text-xs font-bold text-[#0C0D0D]/60 tracking-wider uppercase">
          Loading Reports...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0C0D0D] text-white p-6 sm:p-8 shadow-2xl border border-white/10">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#ECF4EE]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#ECF4EE]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#ECF4EE]/15 text-[#ECF4EE] border border-[#ECF4EE]/20 backdrop-blur-md">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics & Reports</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Reports Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal max-w-xl">
              Comprehensive overview of attendees, room allocation, groups, and seminar participation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            {/* Export DOCX Button */}
            <button
              onClick={handleExportDOCX}
              disabled={isExporting === 'docx' || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/20 backdrop-blur-md transition-all active:scale-95 disabled:opacity-50"
            >
              {isExporting === 'docx' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              Export DOCX
            </button>

            <button
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md transition-all active:scale-95"
              onClick={() => window.print()}
            >
              <Printer className="h-3.5 w-3.5" />
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 bg-white/80 rounded-3xl border border-[#ECF4EE] p-1 backdrop-blur-xl">
        {[
          { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-3.5 w-3.5" /> },
          { id: 'attendees', label: 'Attendees', icon: <Users className="h-3.5 w-3.5" /> },
          { id: 'rooms', label: 'Rooms', icon: <DoorOpen className="h-3.5 w-3.5" /> },
          { id: 'groups', label: 'Groups', icon: <Users className="h-3.5 w-3.5" /> },
          { id: 'seminars', label: 'Seminars', icon: <Calendar className="h-3.5 w-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedTab === tab.id
                ? 'bg-[#0C0D0D] text-[#ECF4EE] shadow-sm'
                : 'text-[#0C0D0D]/50 hover:text-[#0C0D0D] hover:bg-[#ECF4EE]/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== OVERVIEW TAB ==================== */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Total Attendees</span>
                <div className="p-2.5 rounded-2xl bg-[#0C0D0D] text-[#ECF4EE] shadow-sm">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-black text-[#0C0D0D]">{totalAttendees}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-[#0C0D0D]/60">
                <span className="font-semibold">{arrived} Checked In</span>
                <span>•</span>
                <span className="font-semibold">{notArrived} Pending</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Rooms</span>
                <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
                  <DoorOpen className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-black text-[#0C0D0D]">{totalRooms}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-[#0C0D0D]/60">
                <span className="font-semibold">{availableRooms} Available</span>
                <span>•</span>
                <span className="font-semibold">{occupiedRooms} Occupied</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Groups</span>
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-black text-[#0C0D0D]">{totalGroups}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-[#0C0D0D]/60">
                <span className="font-semibold">{totalMembers} Members</span>
                <span>•</span>
                <span className="font-semibold">Avg {avgGroupSize} per group</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Seminars</span>
                <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Calendar className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-4 text-3xl font-black text-[#0C0D0D]">{totalSeminars}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-[#0C0D0D]/60">
                <span className="font-semibold">{totalRegistrations} Registrations</span>
                <span>•</span>
                <span className="font-semibold">{seminarAttendanceRate}% Attendance</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendee Status */}
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <h3 className="text-sm font-extrabold text-[#0C0D0D] mb-4 flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Attendee Status
              </h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendeePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {attendeePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      align="center"
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-center text-xs text-[#0C0D0D]/50">
                <span className="font-semibold text-[#0C0D0D]">{arrived}</span> checked in ·{' '}
                <span className="font-semibold text-[#0C0D0D]">{notArrived}</span> pending ·{' '}
                <span className="font-semibold text-[#0C0D0D]">{arrivalRate}%</span> arrival rate
              </div>
            </div>

            {/* Room Status */}
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <h3 className="text-sm font-extrabold text-[#0C0D0D] mb-4 flex items-center gap-2">
                <DoorOpen className="h-4 w-4" />
                Room Status
              </h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dormPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dormPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      align="center"
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-center text-xs text-[#0C0D0D]/50">
                <span className="font-semibold text-[#0C0D0D]">{availableRooms}</span> available ·{' '}
                <span className="font-semibold text-[#0C0D0D]">{occupiedRooms}</span> occupied ·{' '}
                <span className="font-semibold text-[#0C0D0D]">{occupancyRate}%</span> occupancy
              </div>
            </div>
          </div>

          {/* Region Distribution */}
          {regionChartData.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-extrabold text-[#0C0D0D] flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Regional Distribution
                </h3>
                <span className="text-[10px] text-[#0C0D0D]/40 font-medium">
                  {byRegion.length} regions
                </span>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ECF4EE" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#0C0D0D', opacity: 0.6 }} />
                    <YAxis tick={{ fontSize: 10, fill: '#0C0D0D', opacity: 0.6 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                    <Bar dataKey="total" fill="#0C0D0D" radius={[4, 4, 0, 0]} name="Total" />
                    <Bar dataKey="arrived" fill="#10b981" radius={[4, 4, 0, 0]} name="Arrived" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== ATTENDEES TAB ==================== */}
      {selectedTab === 'attendees' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0C0D0D]/40" />
                <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Total Attendees</p>
              </div>
              <p className="mt-2 text-3xl font-black text-[#0C0D0D]">{totalAttendees}</p>
            </div>
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Checked In</p>
              </div>
              <p className="mt-2 text-3xl font-black text-emerald-600">{arrived}</p>
              <p className="text-xs text-[#0C0D0D]/50 mt-1">{arrivalRate}% arrival rate</p>
            </div>
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Pending</p>
              </div>
              <p className="mt-2 text-3xl font-black text-amber-600">{notArrived}</p>
            </div>
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#0C0D0D]/40" />
                <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Recent Arrivals</p>
              </div>
              <p className="mt-2 text-3xl font-black text-[#0C0D0D]">{recentArrivals}</p>
            </div>
          </div>

          {/* Gender Distribution */}
          {genderChartData.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <h3 className="text-sm font-extrabold text-[#0C0D0D] mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Gender Distribution
              </h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={genderChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ECF4EE" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#0C0D0D', opacity: 0.6 }} />
                    <YAxis tick={{ fontSize: 10, fill: '#0C0D0D', opacity: 0.6 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                    <Bar dataKey="total" fill="#0C0D0D" radius={[4, 4, 0, 0]} name="Total" />
                    <Bar dataKey="assigned" fill="#10b981" radius={[4, 4, 0, 0]} name="Assigned" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Region Table */}
          {byRegion.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#ECF4EE] shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-[#ECF4EE] flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#0C0D0D] flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Regional Breakdown
                </h3>
                <span className="text-[10px] text-[#0C0D0D]/40 font-medium">
                  {byRegion.reduce((acc: number, r: any) => acc + (r.total || 0), 0)} total attendees
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#FAFAFA] border-b border-[#ECF4EE]">
                      <th className="px-6 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Region</th>
                      <th className="px-6 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Total</th>
                      <th className="px-6 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Arrived</th>
                      <th className="px-6 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Pending</th>
                      <th className="px-6 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECF4EE]">
                    {byRegion.map((r: any) => {
                      const rate = r.total > 0 ? Math.round((r.arrived || 0) / r.total * 100) : 0;
                      return (
                        <tr key={r._id} className="hover:bg-[#ECF4EE]/20 transition-colors">
                          <td className="px-6 py-3 text-xs font-bold text-[#0C0D0D]">{r._id}</td>
                          <td className="px-6 py-3 text-xs font-semibold text-right">{r.total || 0}</td>
                          <td className="px-6 py-3 text-xs font-semibold text-right text-emerald-600">{r.arrived || 0}</td>
                          <td className="px-6 py-3 text-xs font-semibold text-right text-amber-600">{r.not_arrived || 0}</td>
                          <td className="px-6 py-3 text-right">
                            <Badge variant={rate > 50 ? 'success' : 'default'} className="text-[10px] font-bold">
                              {rate}%
                            </Badge>
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
      )}

      {/* ==================== ROOMS TAB ==================== */}
      {selectedTab === 'rooms' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <DoorOpen className="h-4 w-4 text-[#0C0D0D]/40" />
                <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Total Rooms</p>
              </div>
              <p className="mt-2 text-3xl font-black text-[#0C0D0D]">{totalRooms}</p>
              <p className="text-xs text-[#0C0D0D]/50 mt-1">{totalBeds} total beds</p>
            </div>
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Available</p>
              </div>
              <p className="mt-2 text-3xl font-black text-emerald-600">{availableRooms}</p>
              <p className="text-xs text-[#0C0D0D]/50 mt-1">{availableBeds} beds available</p>
            </div>
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-amber-600" />
                <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Occupied</p>
              </div>
              <p className="mt-2 text-3xl font-black text-amber-600">{occupiedRooms}</p>
              <p className="text-xs text-[#0C0D0D]/50 mt-1">{occupiedBeds} beds occupied</p>
            </div>
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#0C0D0D]/40" />
                <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Occupancy Rate</p>
              </div>
              <p className="mt-2 text-3xl font-black text-[#0C0D0D]">{occupancyRate}%</p>
              <div className="w-full bg-[#ECF4EE] rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="h-1.5 rounded-full bg-[#0C0D0D] transition-all duration-500"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <h3 className="text-sm font-extrabold text-[#0C0D0D] mb-4 flex items-center gap-2">
                <DoorOpen className="h-4 w-4" />
                Room Status
              </h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dormPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {dormPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <h3 className="text-sm font-extrabold text-[#0C0D0D] mb-4 flex items-center gap-2">
                <BedDouble className="h-4 w-4" />
                Bed Status
              </h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bedPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {bedPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Building Stats */}
          {(dormStats?.buildings?.details?.length ?? 0) > 0 && (
            <div className="bg-white rounded-3xl border border-[#ECF4EE] shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-[#ECF4EE] flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#0C0D0D] flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Building Details
                </h3>
                <span className="text-[10px] text-[#0C0D0D]/40 font-medium">
                  {dormStats?.buildings?.details?.length ?? 0} buildings
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#FAFAFA] border-b border-[#ECF4EE]">
                      <th className="px-6 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Building</th>
                      <th className="px-6 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Type</th>
                      <th className="px-6 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Rooms</th>
                      <th className="px-6 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Beds</th>
                      <th className="px-6 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Occupied</th>
                      <th className="px-6 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECF4EE]">
                    {dormStats?.buildings?.details?.map((b: any) => (
                      <tr key={b._id} className="hover:bg-[#ECF4EE]/20 transition-colors">
                        <td className="px-6 py-3 text-xs font-bold text-[#0C0D0D]">{b.name}</td>
                        <td className="px-6 py-3 text-xs text-right capitalize">
                          <Badge variant="info" className="text-[9px] font-bold">
                            {b.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-3 text-xs font-semibold text-right">{b.total_rooms}</td>
                        <td className="px-6 py-3 text-xs font-semibold text-right">{b.total_beds}</td>
                        <td className="px-6 py-3 text-xs font-semibold text-right text-amber-600">{b.occupied_beds}</td>
                        <td className="px-6 py-3 text-right">
                          <Badge variant={b.occupancy_rate > 50 ? 'success' : 'default'} className="text-[10px] font-bold">
                            {Math.round(b.occupancy_rate)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== GROUPS TAB ==================== */}
      {selectedTab === 'groups' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0C0D0D]/40" />
                <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Total Groups</p>
              </div>
              <p className="mt-2 text-3xl font-black text-[#0C0D0D]">{totalGroups}</p>
            </div>
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0C0D0D]/40" />
                <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Total Members</p>
              </div>
              <p className="mt-2 text-3xl font-black text-[#0C0D0D]">{totalMembers}</p>
            </div>
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#0C0D0D]/40" />
                <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Avg Group Size</p>
              </div>
              <p className="mt-2 text-3xl font-black text-[#0C0D0D]">{avgGroupSize}</p>
            </div>
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-[#0C0D0D]/40" />
                <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Occupancy Rate</p>
              </div>
              <p className="mt-2 text-3xl font-black text-[#0C0D0D]">{groupOccupancyRate}%</p>
              <div className="w-full bg-[#ECF4EE] rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="h-1.5 rounded-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${groupOccupancyRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Group Status Chart */}
          {groupPieData.some(d => d.value > 0) && (
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <h3 className="text-sm font-extrabold text-[#0C0D0D] mb-4 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Group Status Distribution
              </h3>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={groupPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {groupPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} align="center" verticalAlign="bottom" wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Groups Table */}
          {(groupStats?.groups?.length ?? 0) > 0 && (
            <div className="bg-white rounded-3xl border border-[#ECF4EE] shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-[#ECF4EE] flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#0C0D0D] flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Groups Overview
                </h3>
                <span className="text-[10px] text-[#0C0D0D]/40 font-medium">
                  {groupStats?.groups?.length ?? 0} groups
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#FAFAFA] border-b border-[#ECF4EE]">
                      <th className="px-6 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Group Name</th>
                      <th className="px-6 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Members</th>
                      <th className="px-6 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Capacity</th>
                      <th className="px-6 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Points</th>
                      <th className="px-6 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECF4EE]">
                    {groupStats?.groups?.map((g: any) => (
                      <tr key={g._id} className="hover:bg-[#ECF4EE]/20 transition-colors">
                        <td className="px-6 py-3 text-xs font-bold text-[#0C0D0D]">{g.name}</td>
                        <td className="px-6 py-3 text-xs font-semibold text-right">{g.members_count || 0}</td>
                        <td className="px-6 py-3 text-xs font-semibold text-right">{g.capacity || 0}</td>
                        <td className="px-6 py-3 text-xs font-semibold text-right">{g.points || 0}</td>
                        <td className="px-6 py-3 text-right">
                          <Badge variant={g.is_full ? 'success' : g.members_count > 0 ? 'warning' : 'default'} className="text-[10px] font-bold">
                            {g.is_full ? 'Full' : g.members_count > 0 ? 'Partial' : 'Empty'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {totalGroups === 0 && (
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-12 text-center shadow-xs">
              <Users className="h-12 w-12 text-[#0C0D0D]/20 mx-auto mb-3" />
              <p className="text-sm font-bold text-[#0C0D0D]">No Groups Found</p>
              <p className="text-xs text-[#0C0D0D]/50 mt-1">Group data will appear here once groups are formed.</p>
            </div>
          )}
        </div>
      )}

      {/* ==================== SEMINARS TAB ==================== */}
      {selectedTab === 'seminars' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#0C0D0D]/40" />
                <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Total Seminars</p>
              </div>
              <p className="mt-2 text-3xl font-black text-[#0C0D0D]">{totalSeminars}</p>
            </div>
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0C0D0D]/40" />
                <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Registrations</p>
              </div>
              <p className="mt-2 text-3xl font-black text-[#0C0D0D]">{totalRegistrations}</p>
            </div>
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-emerald-600" />
                <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Attendance</p>
              </div>
              <p className="mt-2 text-3xl font-black text-emerald-600">{totalAttendance}</p>
            </div>
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#0C0D0D]/40" />
                <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Attendance Rate</p>
              </div>
              <p className="mt-2 text-3xl font-black text-[#0C0D0D]">{seminarAttendanceRate}%</p>
              <div className="w-full bg-[#ECF4EE] rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className="h-1.5 rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${seminarAttendanceRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Seminar by Day Chart */}
          {(seminarStats?.by_day?.length ?? 0) > 0 && (
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
              <h3 className="text-sm font-extrabold text-[#0C0D0D] mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Seminar Activity by Day
              </h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seminarStats?.by_day} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ECF4EE" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#0C0D0D', opacity: 0.6 }} />
                    <YAxis tick={{ fontSize: 10, fill: '#0C0D0D', opacity: 0.6 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                    <Bar dataKey="seminars" fill="#0C0D0D" radius={[4, 4, 0, 0]} name="Seminars" />
                    <Bar dataKey="registrations" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Registrations" />
                    <Bar dataKey="attendance" fill="#10b981" radius={[4, 4, 0, 0]} name="Attendance" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top Seminars */}
          {(seminarStats?.top_seminars?.length ?? 0) > 0 && (
            <div className="bg-white rounded-3xl border border-[#ECF4EE] shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-[#ECF4EE] flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-[#0C0D0D] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Top Seminars
                </h3>
                <span className="text-[10px] text-[#0C0D0D]/40 font-medium">
                  {seminarStats?.top_seminars?.length ?? 0} seminars
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#FAFAFA] border-b border-[#ECF4EE]">
                      <th className="px-6 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Seminar</th>
                      <th className="px-6 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Registrations</th>
                      <th className="px-6 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Attendance</th>
                      <th className="px-6 py-3 text-right text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECF4EE]">
                    {seminarStats?.top_seminars?.map((s: any, index: number) => {
                      const rate = s.registrations > 0 ? Math.round((s.attendance || 0) / s.registrations * 100) : 0;
                      return (
                        <tr key={s._id || index} className="hover:bg-[#ECF4EE]/20 transition-colors">
                          <td className="px-6 py-3 text-xs font-bold text-[#0C0D0D]">{s.title || s.name || `Seminar ${index + 1}`}</td>
                          <td className="px-6 py-3 text-xs font-semibold text-right">{s.registrations || 0}</td>
                          <td className="px-6 py-3 text-xs font-semibold text-right text-emerald-600">{s.attendance || 0}</td>
                          <td className="px-6 py-3 text-right">
                            <Badge variant={rate > 50 ? 'success' : 'default'} className="text-[10px] font-bold">
                              {rate}%
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* No Seminars Message */}
          {totalSeminars === 0 && (
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-12 text-center shadow-xs">
              <Calendar className="h-12 w-12 text-[#0C0D0D]/20 mx-auto mb-3" />
              <p className="text-sm font-bold text-[#0C0D0D]">No Seminars Found</p>
              <p className="text-xs text-[#0C0D0D]/50 mt-1">Seminar data will appear here once available.</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-[10px] text-[#0C0D0D]/30 font-medium border-t border-[#ECF4EE] pt-4">
        Last updated: {lastUpdated.toLocaleString()}
      </div>
    </div>
  );
}