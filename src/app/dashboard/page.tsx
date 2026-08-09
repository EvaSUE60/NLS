// src/app/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { useAttendeeStore } from '@/src/store/attendee.store';
import { useBuildingStore } from '@/src/store/building.store';
import { useDormStore } from '@/src/store/dorm.store';
import { useSeminarStore } from '@/src/store/seminar.store';
import { useGroupStore } from '@/src/store/group.store';
import { LiveCheckInChart } from '@/src/components/dashboard/LiveCheckInChart';
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
  const { 
    attendees, 
    isLoading: attendeesLoading, 
    initialize,
    stats: attendeeStats,
    fetchArrivalStats 
  } = useAttendeeStore();
  
  const { stats: dormStats, isLoading: dormLoading, fetchStats } = useDormStore();
  const { buildings, isLoading: buildingLoading, fetchBuildings } = useBuildingStore();
  const { stats: groupStats, isLoading: groupLoading, fetchStats: fetchGroupStats } = useGroupStore();

  // Get seminar store
  const seminarStore = useSeminarStore();
  const seminarStats = seminarStore?.stats || null;
  const seminarLoading = seminarStore?.isLoading || false;
  const fetchSeminarStats = seminarStore?.fetchStats;

  // Initialize data once on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Initialize attendees first (this will fetch initial data)
        await initialize();
        
        // Then fetch stats and other data in parallel
        await Promise.all([
          fetchArrivalStats(),
          fetchStats(),
          fetchBuildings(),
          fetchGroupStats?.() || Promise.resolve(),
          fetchSeminarStats?.() || Promise.resolve(),
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };
    
    loadData();
  }, []); // Empty dependency array - only runs once

  // ==================== ✅ FIXED: Calculate statistics using stats from API ====================
  // Use the correct AttendeeStats structure (summary)
  const totalAttendees = attendeeStats?.summary?.total_attendees || 0;
  const checkedIn = attendeeStats?.summary?.arrived || 0;
  const notCheckedIn = Math.max(0, totalAttendees - checkedIn);
  
  // Calculate male/female counts from attendees array
  const maleCount = attendees?.filter(a => a.gender === 'Male').length || 0;
  const femaleCount = attendees?.filter(a => a.gender === 'Female').length || 0;
  
  const totalRooms = dormStats?.rooms?.total || 0;
  const totalGroups = groupStats?.summary?.total_groups || 0;
  const totalSeminars = seminarStats?.summary?.total_seminars || 0;

  // Pie chart data for attendance distribution
  const pieData = [
    { name: 'Checked In', value: checkedIn, color: '#10b981' },
    { name: 'Pending Arrival', value: notCheckedIn, color: '#f59e0b' },
  ].filter((item) => item.value > 0);

  const isLoading = attendeesLoading || dormLoading || buildingLoading || seminarLoading || groupLoading;

  if (isLoading && !attendeeStats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-3xl bg-[#ECF4EE]/40 border border-[#ECF4EE] text-[#0C0D0D]">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#0C0D0D]/5 blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 text-[#0C0D0D] animate-spin relative z-10" />
        </div>
        <p className="mt-4 text-xs font-bold text-[#0C0D0D]/60 tracking-wider uppercase">
          Loading Dashboard Metrics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-2 sm:p-4">
      {/* ==================== WELCOME BANNER ==================== */}
      <div className="relative overflow-hidden rounded-3xl bg-[#ECF4EE] border border-[#d2e5d7] p-6 sm:p-8 text-[#0C0D0D] shadow-sm">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#0C0D0D]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#0C0D0D] text-[#ECF4EE] shadow-xs">
                <Sparkles className="w-3 h-3 text-[#ECF4EE]" /> Executive Overview
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0C0D0D]">
              Welcome back, {user?.name?.split(' ')[0] || 'Administrator'}
            </h1>
            <p className="text-xs sm:text-sm text-[#0C0D0D]/70 max-w-xl font-medium leading-relaxed">
              Real-time synchronization for your event directory, room allocation, and seminar participation.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
            <div className="flex items-center gap-2 bg-white/80 border border-[#0C0D0D]/10 px-3.5 py-2 rounded-2xl text-xs font-medium shadow-2xs">
              <Users className="w-3.5 h-3.5 text-[#0C0D0D]/50" />
              <span className="text-[#0C0D0D]/60">Directory:</span>
              <span className="font-bold text-[#0C0D0D]">{totalAttendees}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 border border-emerald-500/30 px-3.5 py-2 rounded-2xl text-xs font-medium shadow-2xs">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[#0C0D0D]/60">Arrived:</span>
              <span className="font-bold text-emerald-600">{checkedIn}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/80 border border-[#0C0D0D]/10 px-3.5 py-2 rounded-2xl text-xs font-medium shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-[#0C0D0D]/50" />
              <span className="text-[#0C0D0D]/60">Rooms:</span>
              <span className="font-bold text-[#0C0D0D]">{totalRooms}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== LIVE CHECK-IN CHART ==================== */}
      <LiveCheckInChart />

      {/* ==================== STATS CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Attendees */}
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Total Attendees</span>
            <div className="p-2.5 rounded-2xl bg-[#0C0D0D] text-[#ECF4EE] shadow-sm">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-[#0C0D0D] tracking-tight">{totalAttendees}</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-[#0C0D0D]/60 font-medium">
              <span className="font-semibold">{maleCount} Male</span>
              <span>•</span>
              <span className="font-semibold">{femaleCount} Female</span>
            </div>
          </div>
        </div>

        {/* Checked In */}
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Check-In Status</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-emerald-600 tracking-tight">{checkedIn}</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#0C0D0D]/60 font-medium">
              <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                {totalAttendees > 0 ? Math.round((checkedIn / totalAttendees) * 100) : 0}%
              </span>
              <span>attendance rate</span>
            </div>
          </div>
        </div>

        {/* Total Groups */}
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Active Groups</span>
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Group className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-[#0C0D0D] tracking-tight">{totalGroups}</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#0C0D0D]/60 font-medium">
              <span className="text-[#0C0D0D] font-bold">~{totalGroups > 0 ? Math.floor(totalAttendees / totalGroups) : 0}</span>
              <span>attendees per group</span>
            </div>
          </div>
        </div>

        {/* Total Seminars */}
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Seminars</span>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-[#0C0D0D] tracking-tight">{totalSeminars}</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-[#0C0D0D]/60 font-medium">
              <span className="text-[#0C0D0D] font-bold">{seminarStats?.by_day?.length || 0}</span>
              <span>active event days</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== STATUS DISTRIBUTION ==================== */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 sm:p-8 text-[#0C0D0D] shadow-xs flex flex-col justify-between text-center">
          <div>
            <div className="flex flex-col items-center justify-center mb-6 gap-1.5">
              <div className="flex items-center gap-2">
                <PieIcon className="w-5 h-5 text-[#0C0D0D]" />
                <h3 className="text-lg font-black text-[#0C0D0D] tracking-tight">
                  Status Distribution
                </h3>
              </div>
              <p className="text-xs text-[#0C0D0D]/50 font-medium">
                Check-in arrival breakdown • <span className="font-bold text-[#0C0D0D]">{totalAttendees} Total Attendees</span>
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
                          backgroundColor: '#0C0D0D',
                          borderRadius: '16px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                          fontWeight: 600,
                          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        }}
                        formatter={(value: any, name: any) => [`${value} Attendees`, name]}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={9}
                        align="center"
                        wrapperStyle={{
                          fontSize: '12px',
                          fontWeight: 600,
                          paddingTop: '16px',
                          color: '#0C0D0D',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Quick Summary Strip */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#ECF4EE]">
                  <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-100 text-center">
                    <p className="text-2xl font-black text-emerald-600">{checkedIn}</p>
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mt-1">Checked In</p>
                  </div>
                  <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-100 text-center">
                    <p className="text-2xl font-black text-amber-600">{notCheckedIn}</p>
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mt-1">Pending Arrival</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[260px] text-[#0C0D0D]/30">
                <Activity className="w-10 h-10 mb-2 text-[#0C0D0D]/20" />
                <p className="text-xs font-semibold text-[#0C0D0D]/60">No attendees found</p>
                <p className="text-[11px] text-[#0C0D0D]/30">Data will update upon registration sync</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}