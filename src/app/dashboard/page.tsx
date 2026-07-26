// src/app/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { useAttendeeStore } from '@/src/store/attendee.store';
import { useBuildingStore } from '@/src/store/building.store';
import { useDormStore } from '@/src/store/dorm.store';
import { useSeminarStore } from '@/src/store/seminar.store';
import { useGroupStore } from '@/src/store/group.store';
import {
  Users,
  BookOpen,
  Group,
  CheckSquare,
  TrendingUp,
  Sparkles,
  Loader2,
  Building2,
  Activity,
  PieChart as PieIcon,
} from 'lucide-react';

// Import chart components
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();

  // Get store methods directly
  const { attendees, isLoading: attendeesLoading, fetchAttendees } = useAttendeeStore();
  const { stats: dormStats, isLoading: dormLoading, fetchStats } = useDormStore();
  const { buildings, isLoading: buildingLoading, fetchBuildings } = useBuildingStore();
  const { stats: groupStats, isLoading: groupLoading, fetchStats: fetchGroupStats } = useGroupStore();

  // Get seminar store
  const seminarStore = useSeminarStore();
  const seminarStats = seminarStore?.stats || null;
  const seminarLoading = seminarStore?.isLoading || false;
  const fetchSeminarStats = seminarStore?.fetchStats;

  // Fetch data on mount
  useEffect(() => {
    fetchAttendees();
    fetchStats();
    fetchBuildings();
    fetchGroupStats?.();

    if (fetchSeminarStats && typeof fetchSeminarStats === 'function') {
      fetchSeminarStats();
    }
  }, []);

  // Calculate statistics
  const totalAttendees = attendees?.length || 0;
  const checkedIn = attendees?.filter((a) => a.arrived).length || 0;
  const notCheckedIn = Math.max(0, totalAttendees - checkedIn);
  const totalRooms = dormStats?.rooms?.total || 0;
  const totalGroups = groupStats?.summary?.total_groups || 0;
  const totalSeminars = seminarStats?.summary?.total_seminars || 0;

  // Pie chart data for attendance distribution
  const pieData = [
    { name: 'Checked In', value: checkedIn, color: '#10b981' },
    { name: 'Pending Arrival', value: notCheckedIn, color: '#f59e0b' },
  ].filter((item) => item.value > 0);

  const isLoading = attendeesLoading || dormLoading || buildingLoading || seminarLoading || groupLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-2xl bg-white/60 border border-slate-200/80 backdrop-blur-md">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-slate-900/5 blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 text-slate-900 animate-spin relative z-10" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-600 tracking-wide">Loading Dashboard Metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-2 sm:p-4">
      {/* ==================== WELCOME BANNER ==================== */}
      <div className="relative overflow-hidden rounded-3xl bg-sky-950 border border-sky-800 p-6 sm:p-8 shadow-sm">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-slate-800/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-red-900/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-slate-900 text-slate-300 border border-slate-800">
                <Sparkles className="w-3 h-3 text-red-500" /> Executive Overview
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {user?.name?.split(' ')[0] || 'Administrator'}
            </h1>
            <p className="text-sm text-slate-400 max-w-xl font-normal leading-relaxed">
              Real-time synchronization for your event directory, room allocation, and seminar participation.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 px-3.5 py-2 rounded-xl text-xs">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Directory:</span>
              <span className="font-bold text-white">{totalAttendees}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 px-3.5 py-2 rounded-xl text-xs">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Arrived:</span>
              <span className="font-bold text-emerald-400">{checkedIn}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800/90 px-3.5 py-2 rounded-xl text-xs">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Rooms:</span>
              <span className="font-bold text-white">{totalRooms}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== STATS CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Attendees */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Attendees</span>
            <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-xs">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{totalAttendees}</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                <TrendingUp className="h-3 w-3 mr-0.5 text-emerald-600" /> +12%
              </span>
              <span>vs previous cycle</span>
            </div>
          </div>
        </div>

        {/* Checked In */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Check-In Status</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-emerald-600 tracking-tight">{checkedIn}</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                {totalAttendees > 0 ? Math.round((checkedIn / totalAttendees) * 100) : 0}%
              </span>
              <span>attendance rate</span>
            </div>
          </div>
        </div>

        {/* Total Groups */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Groups</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Group className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{totalGroups}</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="text-slate-700 font-semibold">~{Math.floor(totalAttendees / (totalGroups || 1))}</span>
              <span>attendees per group</span>
            </div>
          </div>
        </div>

        {/* Total Seminars */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Seminars</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{totalSeminars}</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="text-slate-700 font-semibold">{seminarStats?.by_day?.length || 0}</span>
              <span>active event days</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== CENTERED STATUS DISTRIBUTION ==================== */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col justify-between text-center">
          <div>
            {/* Header Centered & Bolder */}
            <div className="flex flex-col items-center justify-center mb-4 gap-2">
              <div className="flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-slate-700" />
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Status Distribution
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Check-in arrival breakdown • <span className="font-semibold text-slate-700">{totalAttendees} Total Attendees</span>
              </p>
            </div>

            {totalAttendees > 0 ? (
              <>
                <div className="h-[260px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={6}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderRadius: '12px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        }}
                        formatter={(value: any, name: any) => [`${value} Attendees`, name]}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={9}
                        align="center"
                        wrapperStyle={{
                          fontSize: '13px',
                          fontWeight: 600,
                          paddingTop: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Quick Summary Strip */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-5 border-t border-slate-100">
                  <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-100/80 text-center">
                    <p className="text-2xl font-black text-emerald-600">{checkedIn}</p>
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mt-0.5">Checked In</p>
                  </div>
                  <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-100/80 text-center">
                    <p className="text-2xl font-black text-amber-600">{notCheckedIn}</p>
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mt-0.5">Pending Arrival</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-slate-400">
                <Activity className="w-10 h-10 mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No attendees found</p>
                <p className="text-[11px] text-slate-400">Data will update upon registration sync</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}