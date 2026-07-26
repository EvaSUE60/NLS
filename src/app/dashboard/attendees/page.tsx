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
  Bed,
  DoorOpen,
  Building2,
  Clock,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
  UserPlus
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
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-2xl bg-white/60 border border-slate-200/80 backdrop-blur-md">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-slate-900/5 blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 text-slate-900 animate-spin relative z-10" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-600 tracking-wide">Loading Attendee Directory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50/50 border border-red-200/80 rounded-2xl p-8 text-center backdrop-blur-sm max-w-lg mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-red-100/80 text-red-600 flex items-center justify-center mx-auto mb-4">
          <X className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">System Interruption</h3>
        <p className="mt-1 text-sm text-slate-600">{error}</p>
        <Button variant="primary" className="mt-6 bg-slate-900 hover:bg-slate-800 text-white shadow-md rounded-xl px-6" onClick={() => { clearError(); refetch(); }}>
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-2 sm:p-4">
      {/* ==================== PAGE HEADER ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Attendee Directory</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              Live
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-normal">Manage registration, real-time check-ins, and housing details.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs rounded-xl px-3.5 py-2 h-10 font-medium text-xs tracking-wide"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Data
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs rounded-xl px-3.5 py-2 h-10 font-medium text-xs tracking-wide"
          >
            <Download className="h-3.5 w-3.5 mr-2" />
            Export
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm rounded-xl px-4 py-2 h-10 font-medium text-xs tracking-wide transition-all"
            onClick={() => router.push('/dashboard/attendees/create')}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Attendee
          </Button>
        </div>
      </div>

      {/* ==================== STATS CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Directory</span>
            <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-xs">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{total}</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="text-slate-700 font-semibold">{attendees.filter(a => a.gender === 'Male').length} Male</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-700 font-semibold">{attendees.filter(a => a.gender === 'Female').length} Female</span>
            </div>
          </div>
        </div>

        {/* Checked In Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Checked In</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-emerald-600 tracking-tight">{arrived}</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="inline-flex items-center text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                {total > 0 ? Math.round((arrived / total) * 100) : 0}%
              </span>
              <span>completion rate</span>
            </div>
          </div>
        </div>

        {/* Remaining Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Arrival</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-amber-600 tracking-tight">{notArrived}</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="inline-flex items-center text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                {total > 0 ? Math.round((notArrived / total) * 100) : 0}%
              </span>
              <span>pending check-in</span>
            </div>
          </div>
        </div>

        {/* Regions Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200">
          <div className="flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Regions</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900 tracking-tight">{regions?.length || 0}</div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Active geographical sectors</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== CONTROLS / FILTERS BAR ==================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, ID, or email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200/90 rounded-xl text-sm font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3.5 py-2 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer h-9"
            >
              <option value="all">All Regions</option>
              {regions?.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="px-3.5 py-2 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer h-9"
            >
              <option value="all">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3.5 py-2 bg-slate-50/50 border border-slate-200/90 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer h-9"
            >
              <option value="all">All Status</option>
              <option value="arrived">Checked In</option>
              <option value="not-arrived">Pending Arrival</option>
            </select>
          </div>
        </div>
      </div>

      {/* ==================== TABLE CONTAINER ==================== */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80">
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Attendee
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Contact
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Region & Gender
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Housing / Room
                </th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Status
                </th>
                <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-slate-400">
                    <div className="max-w-xs mx-auto">
                      <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-600">No attendees matched your filter</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting search parameters or clear filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                attendees.map((attendee) => (
                  <tr
                    key={attendee._id}
                    className="group hover:bg-slate-50/80 transition-colors duration-150 cursor-pointer"
                    onClick={() => handleView(attendee)}
                  >
                    {/* Attendee Name & ID */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          <Avatar
                            name={`${attendee.first_name} ${attendee.last_name}`}
                            size="md"
                            className="rounded-full shadow-2xs ring-1 ring-slate-200"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 group-hover:text-slate-900 transition-colors">
                            {attendee.first_name} {attendee.last_name}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400 tracking-tight mt-0.5">
                            {attendee.unique_id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-slate-700">{attendee.email}</p>
                        <p className="text-[11px] text-slate-400">{attendee.phone}</p>
                      </div>
                    </td>

                    {/* Region */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-700">{attendee.region}</span>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200/60 px-2 py-0.5 rounded-full">
                          {attendee.gender}
                        </span>
                      </div>
                    </td>

                    {/* Room */}
                    <td className="px-5 py-4">
                      {attendee.dorm_cache?.roomNumber ? (
                        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-lg">
                          <DoorOpen className="h-3.5 w-3.5 text-slate-400" />
                          <span>Rm {attendee.dorm_cache.roomNumber}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500">Bed {attendee.dorm_cache.bedNumber}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {attendee.arrived ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>Checked In</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                            <Clock className="h-3 w-3 text-amber-500" />
                            <span>Pending</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {!attendee.arrived && (
                          <button
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                            onClick={() => handleCheckIn(attendee._id)}
                            disabled={isCheckingIn}
                            title="Check In Attendee"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all"
                          onClick={() => handleView(attendee)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
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
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 font-medium">
              Showing <span className="font-semibold text-slate-800">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-semibold text-slate-800">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-semibold text-slate-800">{pagination.total}</span> attendees
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page === 1}
                onClick={() => goToPage(pagination.page - 1)}
                className="bg-white border border-slate-200/90 text-slate-700 h-8 px-3 text-xs rounded-lg font-medium shadow-2xs disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Button>
              <span className="text-xs font-semibold text-slate-700 px-2">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => goToPage(pagination.page + 1)}
                className="bg-white border border-slate-200/90 text-slate-700 h-8 px-3 text-xs rounded-lg font-medium shadow-2xs disabled:opacity-50"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ==================== LUXURY MODAL OVERLAY ==================== */}
      {viewModalOpen && selectedAttendee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200/80">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendee Dossier</span>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Main Avatar & Name */}
              <div className="flex items-center gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
                <Avatar
                  name={`${selectedAttendee.first_name} ${selectedAttendee.last_name}`}
                  size="lg"
                  className="rounded-full shadow-xs ring-2 ring-white"
                />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                    {selectedAttendee.first_name} {selectedAttendee.last_name}
                  </h3>
                  <p className="text-xs font-mono text-slate-400">{selectedAttendee.unique_id}</p>

                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-200/60 text-slate-700">
                      {selectedAttendee.gender}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${selectedAttendee.arrived ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                      {selectedAttendee.arrived ? 'Checked In' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Grid Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Contact Section */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contact Information</span>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 text-xs text-slate-700">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{selectedAttendee.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-700">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{selectedAttendee.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Affiliation & Region</span>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 text-xs text-slate-700">
                      <Church className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{selectedAttendee.local_church || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-700">
                      <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{selectedAttendee.campus || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{selectedAttendee.region}</span>
                    </div>
                  </div>
                </div>

                {/* Housing Details */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3 sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Housing Allocation</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Room</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedAttendee.dorm_cache?.roomNumber || 'None'}</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Bed</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedAttendee.dorm_cache?.bedNumber || 'None'}</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Building</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{selectedAttendee.dorm_cache?.buildingName || 'None'}</p>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Floor</p>
                      <p className="text-xs font-bold text-slate-800 mt-0.5">{selectedAttendee.dorm_cache?.floor || 'None'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                {!selectedAttendee.arrived && (
                  <Button
                    variant="primary"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-4 text-xs font-semibold shadow-xs"
                    onClick={() => {
                      handleCheckIn(selectedAttendee._id);
                      setViewModalOpen(false);
                    }}
                    disabled={isCheckingIn}
                  >
                    <UserCheck className="h-4 w-4 mr-1.5" />
                    Check In Attendee
                  </Button>
                )}
                <Button
                  variant="danger"
                  className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/60 rounded-xl h-10 px-4 text-xs font-semibold ml-auto transition-colors"
                  onClick={() => handleDelete(selectedAttendee._id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}