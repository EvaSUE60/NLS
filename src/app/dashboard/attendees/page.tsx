// src/app/dashboard/attendees/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  Search,
  Plus,
  Download,
  RefreshCw,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Mail,
  Phone,
  MapPin,
  Church,
  GraduationCap,
  DoorOpen,
  Clock,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Filter
} from 'lucide-react';
import { useAttendee } from '@/src/hooks/useAttendee';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Avatar } from '@/src/components/ui/Avatar';
import { useRouter } from 'next/navigation';

export default function AttendeesPage() {
  const router = useRouter();
  const {
    attendees,
    isLoading,
    error,
    pagination,
    stats,
    regions,
    fetch,
    delete: deleteAttendee,
    checkIn: checkInArrival,
    search,
    goToPage,
    refetch,
    clearError,
    fetchStats,
  } = useAttendee();

  // Local state for UI
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAttendee, setSelectedAttendee] = useState<any>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Fetch attendees on mount
  useEffect(() => {
    fetch({ page: 1, limit: 20 });
    fetchStats();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        search(searchQuery);
      } else {
        refetch();
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle filter changes
  const handleFilterChange = useCallback(() => {
    const filters: any = { page: 1 };

    if (selectedRegion !== 'all') filters.region = selectedRegion;
    if (selectedGender !== 'all') filters.gender = selectedGender;
    if (selectedStatus === 'arrived') filters.arrived = true;
    if (selectedStatus === 'not-arrived') filters.arrived = false;

    fetch(filters);
  }, [selectedRegion, selectedGender, selectedStatus, fetch]);

  useEffect(() => {
    handleFilterChange();
  }, [selectedRegion, selectedGender, selectedStatus, handleFilterChange]);

  // Handle check-in
  const handleCheckIn = async (id: string) => {
    setIsCheckingIn(true);
    try {
      await checkInArrival(id, 'manual');
      await refetch();
    } catch (error) {
      console.error('Check-in failed:', error);
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendee?')) return;

    setIsDeleting(true);
    try {
      await deleteAttendee(id);
      await refetch();
      setViewModalOpen(false);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle view
  const handleView = (attendee: any) => {
    setSelectedAttendee(attendee);
    setViewModalOpen(true);
  };

  // Calculate stats
  const total = stats?.summary?.total_attendees ?? 0;
  const arrived = stats?.summary?.arrived ?? 0;
  const notArrived = total - arrived;

  if (isLoading && attendees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] rounded-3xl bg-[#FFFFFF]/70 border border-[#ECF4EE] backdrop-blur-xl shadow-xl">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#ECF4EE] blur-2xl animate-pulse" />
          <Loader2 className="h-10 w-10 text-[#0C0D0D] animate-spin relative z-10" />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[#0C0D0D]/60">
          Loading Directory Engine...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FFFFFF]/80 border border-red-200/80 rounded-3xl p-8 text-center backdrop-blur-xl shadow-xl max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-100">
          <X className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-[#0C0D0D]">System Interruption</h3>
        <p className="mt-1 text-xs text-[#0C0D0D]/60">{error}</p>
        <Button
          variant="primary"
          className="mt-6 bg-[#0C0D0D] hover:bg-[#0C0D0D]/90 text-white shadow-md rounded-2xl px-6 py-2.5 text-xs font-semibold tracking-wide"
          onClick={() => { clearError(); refetch(); }}
        >
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-3 sm:p-6 space-y-8 max-w-[1600px] mx-auto text-[#0C0D0D]">
      
      {/* ==================== HERO HEADER ==================== */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0C0D0D] text-white p-6 sm:p-8 shadow-2xl border border-white/10">
        {/* Mint Glass Backdrop Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#ECF4EE]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#ECF4EE]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-[#ECF4EE]/15 text-[#ECF4EE] border border-[#ECF4EE]/20 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Attendee Management Suite</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Attendee Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-normal max-w-xl">
              Real-time attendee check-in management, accommodation allocation, and regional tracking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </button>
            <button
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-md transition-all active:scale-95"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
            <button
              onClick={() => router.push('/dashboard/attendees/create')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-[#ECF4EE] text-[#0C0D0D] hover:bg-white transition-all shadow-lg shadow-[#ECF4EE]/10 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Add Attendee
            </button>
          </div>
        </div>
      </div>

      {/* ==================== STATS CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Directory Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white/80 border border-[#ECF4EE] p-6 backdrop-blur-xl shadow-xs hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0C0D0D]/50">Total Directory</span>
            <div className="p-3 rounded-2xl bg-[#0C0D0D] text-[#ECF4EE] shadow-sm">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#0C0D0D] tracking-tight">{total}</div>
            <div className="mt-2 flex items-center gap-2 text-xs font-medium text-[#0C0D0D]/60">
              <span className="font-semibold">{attendees.filter(a => a.gender === 'Male').length} Male</span>
              <span>•</span>
              <span className="font-semibold">{attendees.filter(a => a.gender === 'Female').length} Female</span>
            </div>
          </div>
        </div>

        {/* Checked In Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white/80 border border-[#ECF4EE] p-6 backdrop-blur-xl shadow-xs hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0C0D0D]/50">Checked In</span>
            <div className="p-3 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#0C0D0D] tracking-tight">{arrived}</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#0C0D0D]/60">
              <span className="inline-flex items-center font-bold bg-[#ECF4EE] text-[#0C0D0D] px-2 py-0.5 rounded-lg text-[11px]">
                {total > 0 ? Math.round((arrived / total) * 100) : 0}%
              </span>
              <span>completion rate</span>
            </div>
          </div>
        </div>

        {/* Pending Arrival Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white/80 border border-[#ECF4EE] p-6 backdrop-blur-xl shadow-xs hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0C0D0D]/50">Pending Check-in</span>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-700 tracking-tight">{notArrived}</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#0C0D0D]/60">
              <span className="inline-flex items-center font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-lg text-[11px]">
                {total > 0 ? Math.round((notArrived / total) * 100) : 0}%
              </span>
              <span>awaiting arrival</span>
            </div>
          </div>
        </div>

        {/* Active Regions Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white/80 border border-[#ECF4EE] p-6 backdrop-blur-xl shadow-xs hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0C0D0D]/50">Regions</span>
            <div className="p-3 rounded-2xl bg-[#0C0D0D]/5 text-[#0C0D0D]">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl sm:text-4xl font-extrabold text-[#0C0D0D] tracking-tight">{regions?.length || 0}</div>
            <div className="mt-2 text-xs font-medium text-[#0C0D0D]/60">
              Geographical distribution
            </div>
          </div>
        </div>
      </div>

      {/* ==================== FILTERS & SEARCH ==================== */}
      <div className="rounded-3xl bg-white/80 border border-[#ECF4EE] p-4 backdrop-blur-xl shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0C0D0D]/40 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by attendee name, unique ID, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-[#FAFAFA] border border-[#ECF4EE] rounded-2xl text-xs font-medium text-[#0C0D0D] placeholder:text-[#0C0D0D]/40 focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase text-[#0C0D0D]/40">
              <Filter className="h-3.5 w-3.5" />
              <span>Filters</span>
            </div>

            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-2.5 bg-[#FAFAFA] border border-[#ECF4EE] rounded-2xl text-xs font-semibold text-[#0C0D0D] focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all cursor-pointer h-11"
            >
              <option value="all">All Regions</option>
              {regions?.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="px-4 py-2.5 bg-[#FAFAFA] border border-[#ECF4EE] rounded-2xl text-xs font-semibold text-[#0C0D0D] focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all cursor-pointer h-11"
            >
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 bg-[#FAFAFA] border border-[#ECF4EE] rounded-2xl text-xs font-semibold text-[#0C0D0D] focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all cursor-pointer h-11"
            >
              <option value="all">All Status</option>
              <option value="arrived">Checked In</option>
              <option value="not-arrived">Pending Check-in</option>
            </select>
          </div>
        </div>
      </div>

      {/* ==================== ATTENDEE DIRECTORY TABLE ==================== */}
      <div className="rounded-3xl bg-white/80 border border-[#ECF4EE] backdrop-blur-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#ECF4EE]">
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">
                  Attendee Info
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">
                  Contact
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">
                  Region & Gender
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">
                  Housing Allocation
                </th>
                <th className="px-6 py-4 text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/50">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECF4EE]/60">
              {attendees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D] flex items-center justify-center mx-auto mb-3">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-bold text-[#0C0D0D]">No attendees found</p>
                      <p className="text-xs text-[#0C0D0D]/50">Adjust your active search query or filter settings.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                attendees.map((attendee) => (
                  <tr
                    key={attendee._id}
                    className="group hover:bg-[#ECF4EE]/30 transition-all duration-200 cursor-pointer"
                    onClick={() => handleView(attendee)}
                  >
                    {/* Attendee Name & ID */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <Avatar
                          name={`${attendee.first_name} ${attendee.last_name}`}
                          size="md"
                          className="rounded-2xl ring-2 ring-[#ECF4EE] bg-[#0C0D0D] text-white"
                        />
                        <div>
                          <p className="text-sm font-bold text-[#0C0D0D] group-hover:text-black">
                            {attendee.first_name} {attendee.last_name}
                          </p>
                          <p className="text-[11px] font-mono font-medium text-[#0C0D0D]/40 mt-0.5">
                            {attendee.unique_id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-[#0C0D0D]">{attendee.email}</p>
                        <p className="text-[11px] text-[#0C0D0D]/50">{attendee.phone}</p>
                      </div>
                    </td>

                    {/* Region */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#0C0D0D]">{attendee.region}</span>
                        <span className="text-[10px] font-bold text-[#0C0D0D] bg-[#ECF4EE] px-2 py-0.5 rounded-md border border-[#ECF4EE]">
                          {attendee.gender}
                        </span>
                      </div>
                    </td>

                    {/* Room */}
                    <td className="px-6 py-4">
                      {attendee.dorm_cache?.roomNumber ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0C0D0D] bg-[#FAFAFA] border border-[#ECF4EE] px-3 py-1 rounded-xl">
                          <DoorOpen className="h-3.5 w-3.5 text-[#0C0D0D]/50" />
                          <span>Rm {attendee.dorm_cache.roomNumber}</span>
                          <span className="text-[#0C0D0D]/20">•</span>
                          <span className="text-[#0C0D0D]/60">Bed {attendee.dorm_cache.bedNumber}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#0C0D0D]/30 italic font-medium">Unassigned</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {attendee.arrived ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#ECF4EE] text-[#0C0D0D] border border-[#ECF4EE]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#0C0D0D]" />
                          <span>Checked In</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          <span>Pending</span>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {!attendee.arrived && (
                          <button
                            className="p-2 rounded-xl bg-[#ECF4EE]/60 hover:bg-[#ECF4EE] text-[#0C0D0D] transition-all active:scale-95"
                            onClick={() => handleCheckIn(attendee._id)}
                            disabled={isCheckingIn}
                            title="Check In Attendee"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          className="p-2 rounded-xl hover:bg-[#ECF4EE]/50 text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-all"
                          onClick={() => handleView(attendee)}
                          title="View Dossier"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-all"
                          onClick={() => handleDelete(attendee._id)}
                          disabled={isDeleting}
                          title="Delete Record"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#ECF4EE] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#0C0D0D]/60 font-medium">
              Showing <span className="font-bold text-[#0C0D0D]">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-bold text-[#0C0D0D]">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-bold text-[#0C0D0D]">{pagination.total}</span> entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => goToPage(pagination.page - 1)}
                className="bg-white border border-[#ECF4EE] text-[#0C0D0D] h-9 px-4 text-xs rounded-xl font-bold disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Button>
              <span className="text-xs font-extrabold text-[#0C0D0D] px-2">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => goToPage(pagination.page + 1)}
                className="bg-white border border-[#ECF4EE] text-[#0C0D0D] h-9 px-4 text-xs rounded-xl font-bold disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ==================== GLASSMORPHIC DOSSIER MODAL ==================== */}
      {viewModalOpen && selectedAttendee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C0D0D]/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[#ECF4EE]">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-[#ECF4EE] px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#0C0D0D]" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/60">Attendee Dossier</span>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-2 rounded-2xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Header Hero Box */}
              <div className="flex items-center gap-4 bg-[#FAFAFA] p-5 rounded-2xl border border-[#ECF4EE]">
                <Avatar
                  name={`${selectedAttendee.first_name} ${selectedAttendee.last_name}`}
                  size="lg"
                  className="rounded-2xl shadow-md ring-2 ring-[#ECF4EE] bg-[#0C0D0D] text-white"
                />
                <div className="space-y-1">
                  <h3 className="text-xl font-extrabold text-[#0C0D0D] tracking-tight">
                    {selectedAttendee.first_name} {selectedAttendee.last_name}
                  </h3>
                  <p className="text-xs font-mono text-[#0C0D0D]/50">{selectedAttendee.unique_id}</p>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-[#ECF4EE] text-[#0C0D0D]">
                      {selectedAttendee.gender}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                      selectedAttendee.arrived ? 'bg-[#0C0D0D] text-white' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {selectedAttendee.arrived ? 'Checked In' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact Info */}
                <div className="bg-white border border-[#ECF4EE] rounded-2xl p-4 space-y-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/40">Contact Info</span>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 text-xs text-[#0C0D0D] font-medium">
                      <Mail className="h-3.5 w-3.5 text-[#0C0D0D]/40 shrink-0" />
                      <span className="truncate">{selectedAttendee.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-[#0C0D0D] font-medium">
                      <Phone className="h-3.5 w-3.5 text-[#0C0D0D]/40 shrink-0" />
                      <span>{selectedAttendee.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Affiliation & Region */}
                <div className="bg-white border border-[#ECF4EE] rounded-2xl p-4 space-y-3">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/40">Affiliation & Region</span>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 text-xs text-[#0C0D0D] font-medium">
                      <Church className="h-3.5 w-3.5 text-[#0C0D0D]/40 shrink-0" />
                      <span className="truncate">{selectedAttendee.local_church || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-[#0C0D0D] font-medium">
                      <GraduationCap className="h-3.5 w-3.5 text-[#0C0D0D]/40 shrink-0" />
                      <span className="truncate">{selectedAttendee.campus || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-[#0C0D0D] font-medium">
                      <MapPin className="h-3.5 w-3.5 text-[#0C0D0D]/40 shrink-0" />
                      <span>{selectedAttendee.region}</span>
                    </div>
                  </div>
                </div>

                {/* Housing Details */}
                <div className="bg-white border border-[#ECF4EE] rounded-2xl p-4 space-y-3 sm:col-span-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0C0D0D]/40">Housing Details</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="bg-[#FAFAFA] p-3 rounded-xl border border-[#ECF4EE]">
                      <p className="text-[10px] text-[#0C0D0D]/40 uppercase font-extrabold">Room</p>
                      <p className="text-xs font-extrabold text-[#0C0D0D] mt-0.5">{selectedAttendee.dorm_cache?.roomNumber || 'None'}</p>
                    </div>
                    <div className="bg-[#FAFAFA] p-3 rounded-xl border border-[#ECF4EE]">
                      <p className="text-[10px] text-[#0C0D0D]/40 uppercase font-extrabold">Bed</p>
                      <p className="text-xs font-extrabold text-[#0C0D0D] mt-0.5">{selectedAttendee.dorm_cache?.bedNumber || 'None'}</p>
                    </div>
                    <div className="bg-[#FAFAFA] p-3 rounded-xl border border-[#ECF4EE]">
                      <p className="text-[10px] text-[#0C0D0D]/40 uppercase font-extrabold">Building</p>
                      <p className="text-xs font-extrabold text-[#0C0D0D] mt-0.5 truncate">{selectedAttendee.dorm_cache?.buildingName || 'None'}</p>
                    </div>
                    <div className="bg-[#FAFAFA] p-3 rounded-xl border border-[#ECF4EE]">
                      <p className="text-[10px] text-[#0C0D0D]/40 uppercase font-extrabold">Floor</p>
                      <p className="text-xs font-extrabold text-[#0C0D0D] mt-0.5">{selectedAttendee.dorm_cache?.floor || 'None'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-[#ECF4EE]">
                {!selectedAttendee.arrived && (
                  <button
                    className="inline-flex items-center gap-2 bg-[#ECF4EE] hover:bg-[#ECF4EE]/80 text-[#0C0D0D] font-bold rounded-2xl h-11 px-5 text-xs shadow-sm transition-all active:scale-95"
                    onClick={() => {
                      handleCheckIn(selectedAttendee._id);
                      setViewModalOpen(false);
                    }}
                    disabled={isCheckingIn}
                  >
                    <UserCheck className="h-4 w-4" />
                    Check In Attendee
                  </button>
                )}
                <button
                  className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/60 font-bold rounded-2xl h-11 px-5 text-xs ml-auto transition-all active:scale-95"
                  onClick={() => handleDelete(selectedAttendee._id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}