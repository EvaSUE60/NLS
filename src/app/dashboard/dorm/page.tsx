// src/app/dashboard/dorm/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  Bed,
  DoorOpen,
  RefreshCw,
  Download,
  XCircle,
  Loader2,
  Zap,
  RotateCcw,
  PieChart,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Badge } from '@/src/components/ui/Badge';
import { useDorm } from '@/src/hooks/useDorm';
import { useBuilding } from '@/src/hooks/useBuilding';
import { toast } from 'sonner';

export default function DormManagementPage() {
  const {
    stats,
    isLoading,
    error,
    isProcessing,
    isExporting, // ✅ Add this
    fetchStats,
    autoAssign,
    resetDorm,
    refresh,
    clearError,
    exportStats, // ✅ Add this
  } = useDorm();

  const { fetchBuildings } = useBuilding();

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchStats();
    fetchBuildings();
  }, []);

  // ==================== ✅ EXPORT HANDLER ====================
  const handleExport = async () => {
    try {
      await exportStats();
      toast.success('Dorm statistics exported successfully!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to export dorm statistics');
    }
  };

  const handleAutoAssign = async () => {
    if (!confirm('This will auto-assign all unassigned attendees to available rooms. Continue?')) {
      return;
    }

    try {
      await autoAssign();
      toast.success('Auto-assignment completed successfully!');
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to auto-assign');
    }
  };

  const handleResetDorm = async () => {
    if (!confirm('⚠️ This will reset ALL dorm assignments. This action cannot be undone! Continue?')) {
      return;
    }

    try {
      await resetDorm();
      toast.success('Dorm assignments reset successfully');
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reset dorm');
    }
  };

  const handleViewBuilding = (building: any) => {
    setSelectedItem(building);
    setViewModalOpen(true);
  };

  // Loading state
  if (isLoading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-3xl bg-[#ECF4EE]/40 border border-[#ECF4EE] text-[#0C0D0D]">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#0C0D0D]/5 blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 text-[#0C0D0D] animate-spin relative z-10" />
        </div>
        <p className="mt-4 text-xs font-bold text-[#0C0D0D]/60 tracking-wider uppercase">
          Loading dorm data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
        <p className="text-rose-700 font-medium">Error loading dorm data: {error}</p>
        <button 
          onClick={() => { clearError(); refresh(); }}
          className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold cursor-pointer transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-2 sm:p-4">
      {/* ==================== WELCOME HERO BANNER ==================== */}
      <div className="relative overflow-hidden rounded-3xl bg-[#ECF4EE] border border-[#d2e5d7] p-6 sm:p-8 text-[#0C0D0D] shadow-sm">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#0C0D0D]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#0C0D0D] text-[#ECF4EE]">
                <Sparkles className="w-3 h-3 text-[#ECF4EE]" /> Facility Overview
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0C0D0D]">
              Dormitory Management
            </h1>
            <p className="text-xs sm:text-sm text-[#0C0D0D]/70 font-medium">
              Manage automated bed assignments, building capacities, and room occupancy status.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleAutoAssign}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 transition-all px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#ECF4EE]" />
              ) : (
                <Zap className="h-4 w-4 text-[#ECF4EE]" />
              )}
              Auto-Assign
            </button>

            <button
              onClick={handleResetDorm}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-rose-600 text-white hover:bg-rose-700 transition-all px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset All
            </button>

            <button 
              onClick={refresh}
              className="p-2.5 bg-white/80 hover:bg-white text-[#0C0D0D] border border-[#0C0D0D]/10 rounded-2xl transition-all shadow-2xs cursor-pointer"
            >
              <RefreshCw className="h-4 w-4 text-[#0C0D0D]/60" />
            </button>

            {/* ✅ Updated Export Button */}
            <button 
              onClick={handleExport}
              disabled={isExporting || isLoading}
              className="flex items-center gap-2 bg-white/80 hover:bg-white text-[#0C0D0D] border border-[#0C0D0D]/10 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#0C0D0D]/60" />
              ) : (
                <Download className="h-4 w-4 text-[#0C0D0D]/60" />
              )}
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>

      {/* ==================== STATS CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Buildings</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{stats?.buildings.total || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#ECF4EE] flex items-center justify-center text-[#0C0D0D]">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#0C0D0D]/70 pt-3 border-t border-[#ECF4EE]">
            <span>{stats?.buildings.men || 0} Men</span>
            <span>·</span>
            <span>{stats?.buildings.women || 0} Women</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Rooms</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{stats?.rooms.total || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#ECF4EE] flex items-center justify-center text-[#0C0D0D]">
              <DoorOpen className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold pt-3 border-t border-[#ECF4EE]">
            <span className="text-emerald-700">{stats?.rooms.available || 0} Available</span>
            <span className="text-[#0C0D0D]/30">·</span>
            <span className="text-amber-700">{stats?.rooms.occupied || 0} Occupied</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Beds</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{stats?.beds.total || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#ECF4EE] flex items-center justify-center text-[#0C0D0D]">
              <Bed className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold pt-3 border-t border-[#ECF4EE]">
            <span className="text-emerald-700">{stats?.beds.available || 0} Available</span>
            <span className="text-[#0C0D0D]/30">·</span>
            <span className="text-amber-700">{stats?.beds.occupied || 0} Occupied</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Assignments</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{stats?.assignments.active || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#ECF4EE] flex items-center justify-center text-[#0C0D0D]">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold pt-3 border-t border-[#ECF4EE]">
            <span className="text-emerald-700">{stats?.attendees.assigned || 0} Assigned</span>
            <span className="text-[#0C0D0D]/30">·</span>
            <span className="text-rose-600">{stats?.attendees.unassigned || 0} Unassigned</span>
          </div>
        </div>
      </div>

      {/* ==================== BUILDING & OCCUPANCY GRID ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Building Stats */}
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
          <h3 className="font-extrabold text-[#0C0D0D] text-base mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#0C0D0D]" />
            Building Details
          </h3>
          <div className="space-y-3">
            {stats?.buildings.details.map((building: any) => (
              <div
                key={building._id}
                className="flex items-center justify-between p-4 bg-[#ECF4EE]/40 hover:bg-[#ECF4EE] rounded-2xl transition-all cursor-pointer border border-[#ECF4EE] group"
                onClick={() => handleViewBuilding(building)}
              >
                <div>
                  <p className="font-extrabold text-[#0C0D0D] text-sm group-hover:text-emerald-800 transition-colors">
                    {building.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-medium text-[#0C0D0D]/60 mt-1">
                    <Badge variant="info" className="bg-[#0C0D0D] text-[#ECF4EE] border-[#0C0D0D] text-[10px] font-bold px-2 py-0.5 rounded-lg capitalize">
                      {building.type}
                    </Badge>
                    <span>{building.total_rooms} rooms</span>
                    <span className="text-[#0C0D0D]/20">·</span>
                    <span>{building.total_beds} beds</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <div>
                    <p className="text-sm font-black text-[#0C0D0D]">
                      {building.occupied_beds}/{building.total_beds}
                    </p>
                    <p className="text-[10px] font-bold uppercase text-[#0C0D0D]/40">Beds Occupied</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#0C0D0D]/40 group-hover:text-[#0C0D0D] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Occupancy Distribution */}
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
          <h3 className="font-extrabold text-[#0C0D0D] text-base mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-[#0C0D0D]" />
            Occupancy Distribution
          </h3>
          <div className="space-y-4">
            {stats?.occupancy_distribution.map((item: any) => {
              const label = item._id === 0 ? 'Empty' : `${item._id} Beds Occupied`;
              const percentage = stats.rooms.total > 0 
                ? Math.round((item.count / stats.rooms.total) * 100) 
                : 0;
              
              let color = 'bg-[#0C0D0D]';
              if (item._id === 0) color = 'bg-rose-500';
              else if (item._id <= 2) color = 'bg-amber-500';

              return (
                <div key={item._id}>
                  <div className="flex items-center justify-between text-xs font-bold text-[#0C0D0D] mb-1.5">
                    <span>{label}</span>
                    <span className="text-[#0C0D0D]/60">{item.count} rooms ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-[#ECF4EE] rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-[#ECF4EE]">
            <div className="flex items-center justify-between text-xs font-black text-[#0C0D0D]">
              <span>Overall Room Occupancy</span>
              <span>{stats?.rooms.occupancy_rate || 0}%</span>
            </div>
            <div className="w-full bg-[#ECF4EE] rounded-full h-2.5 mt-2 overflow-hidden">
              <div 
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  (stats?.rooms.occupancy_rate || 0) >= 80 ? 'bg-[#0C0D0D]' :
                  (stats?.rooms.occupancy_rate || 0) >= 50 ? 'bg-amber-500' :
                  'bg-rose-500'
                }`}
                style={{ width: `${stats?.rooms.occupancy_rate || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== ATTENDEE SUMMARY ==================== */}
      <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs space-y-5">
        <h3 className="font-extrabold text-[#0C0D0D] text-base flex items-center gap-2">
          <Users className="h-5 w-5 text-[#0C0D0D]" />
          Attendee Assignment Summary
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#ECF4EE]/40 border border-[#ECF4EE] rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-[#0C0D0D]">{stats?.attendees.total || 0}</p>
            <p className="text-xs font-bold text-[#0C0D0D]/50 uppercase tracking-wider mt-1">Total Attendees</p>
          </div>
          <div className="bg-[#ECF4EE]/40 border border-[#ECF4EE] rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-emerald-700">{stats?.attendees.assigned || 0}</p>
            <p className="text-xs font-bold text-[#0C0D0D]/50 uppercase tracking-wider mt-1">Assigned Rooms</p>
          </div>
          <div className="bg-[#ECF4EE]/40 border border-[#ECF4EE] rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-rose-600">{stats?.attendees.unassigned || 0}</p>
            <p className="text-xs font-bold text-[#0C0D0D]/50 uppercase tracking-wider mt-1">Unassigned</p>
          </div>
        </div>

        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#0C0D0D]">
            <span>Assignment Completion</span>
            <span>{stats?.attendees.assignment_rate || 0}%</span>
          </div>
          <div className="w-full bg-[#ECF4EE] rounded-full h-2.5 overflow-hidden">
            <div 
              className="h-2.5 rounded-full bg-[#0C0D0D] transition-all duration-500"
              style={{ width: `${stats?.attendees.assignment_rate || 0}%` }}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleAutoAssign}
            disabled={isProcessing || (stats?.attendees.unassigned || 0) === 0}
            className="flex items-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all px-5 py-2.5 rounded-2xl text-xs font-bold shadow-xs cursor-pointer"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#ECF4EE]" />
            ) : (
              <Zap className="h-4 w-4 text-[#ECF4EE]" />
            )}
            Auto-Assign {stats?.attendees.unassigned || 0} Unassigned
          </button>
        </div>
      </div>

      {/* ==================== VIEW BUILDING MODAL ==================== */}
      {viewModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0C0D0D]/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#ECF4EE]">
            <div className="sticky top-0 bg-white border-b border-[#ECF4EE] px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-base font-extrabold text-[#0C0D0D]">{selectedItem.name}</h3>
                <p className="text-xs font-medium text-[#0C0D0D]/50">{selectedItem.building_id}</p>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/50 hover:text-[#0C0D0D] transition-colors cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#ECF4EE]/40 border border-[#ECF4EE] rounded-2xl p-4">
                  <p className="text-[10px] font-black text-[#0C0D0D]/50 uppercase tracking-wider">Type</p>
                  <Badge variant="info" className="mt-1 bg-[#0C0D0D] text-[#ECF4EE] border-[#0C0D0D] text-[10px] font-bold px-2 py-0.5 rounded-lg capitalize">
                    {selectedItem.type}
                  </Badge>
                </div>
                <div className="bg-[#ECF4EE]/40 border border-[#ECF4EE] rounded-2xl p-4">
                  <p className="text-[10px] font-black text-[#0C0D0D]/50 uppercase tracking-wider">Floors</p>
                  <p className="mt-1 text-lg font-black text-[#0C0D0D]">{selectedItem.floors}</p>
                </div>
                <div className="bg-[#ECF4EE]/40 border border-[#ECF4EE] rounded-2xl p-4">
                  <p className="text-[10px] font-black text-[#0C0D0D]/50 uppercase tracking-wider">Total Rooms</p>
                  <p className="mt-1 text-lg font-black text-[#0C0D0D]">{selectedItem.total_rooms}</p>
                </div>
                <div className="bg-[#ECF4EE]/40 border border-[#ECF4EE] rounded-2xl p-4">
                  <p className="text-[10px] font-black text-[#0C0D0D]/50 uppercase tracking-wider">Total Beds</p>
                  <p className="mt-1 text-lg font-black text-[#0C0D0D]">{selectedItem.total_beds}</p>
                </div>
                <div className="bg-[#ECF4EE]/40 border border-[#ECF4EE] rounded-2xl p-4 sm:col-span-2">
                  <p className="text-[10px] font-black text-[#0C0D0D]/50 uppercase tracking-wider">Occupancy Rate</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-bold text-[#0C0D0D]">
                      {selectedItem.occupied_beds} / {selectedItem.total_beds} beds occupied
                    </span>
                    <span className="text-xs font-black text-[#0C0D0D]">
                      {Math.round((selectedItem.occupied_beds / selectedItem.total_beds) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2 mt-2 overflow-hidden border border-[#ECF4EE]">
                    <div 
                      className="h-2 rounded-full bg-[#0C0D0D] transition-all duration-500"
                      style={{ 
                        width: `${Math.round((selectedItem.occupied_beds / selectedItem.total_beds) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[#ECF4EE]">
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold cursor-pointer transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}