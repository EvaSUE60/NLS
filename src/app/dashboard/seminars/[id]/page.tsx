// src/app/dashboard/seminars/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  UserPlus,
  CheckCircle,
  XCircle,
  Loader2,
  Building2,
  DoorOpen,
  Edit,
  Trash2,
  FileText,
  Download,
  RefreshCw,
  BarChart3,
  UserCheck,
  UserX,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { useSeminar } from '@/src/hooks/useSeminar';
import { toast } from 'sonner';

interface SeminarDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SeminarDetailsPage({ params }: SeminarDetailsPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const {
    selectedSeminar: seminar,
    participants,
    participantsStats,
    isLoading,
    error,
    fetchSeminar,
    fetchParticipants,
    delete: deleteSeminar,
    clearSelected,
    clearError,
    // Export state
    isExporting,
    exportProgress,
    exportError,
    exportParticipants,
    clearExportError,
  } = useSeminar();

  const [isDeleting, setIsDeleting] = useState(false);
  const [showParticipants, setShowParticipants] = useState<'all' | 'attended' | 'not-attended'>('all');

  useEffect(() => {
    fetchSeminar(id);
    fetchParticipants(id);
    return () => clearSelected();
  }, [id]);

  useEffect(() => {
    if (seminar) {
      fetchParticipants(id, showParticipants === 'all' ? undefined : showParticipants === 'attended');
    }
  }, [showParticipants, seminar]);

  // Show export error toast
  useEffect(() => {
    if (exportError) {
      toast.error(exportError);
      clearExportError();
    }
  }, [exportError, clearExportError]);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${seminar?.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteSeminar(id);
      toast.success('Seminar deleted successfully');
      router.push('/dashboard/seminars');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete seminar');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = async () => {
    await fetchSeminar(id);
    await fetchParticipants(id);
    toast.success('Refreshed');
  };

  const handleExportParticipantsCSV = async () => {
    try {
      // Build options based on current filter
      const options: any = {
        format: 'csv',
      };
      
      if (showParticipants === 'attended') {
        options.attended = true;
      } else if (showParticipants === 'not-attended') {
        options.attended = false;
      }

      await exportParticipants(id, options);
      toast.success('Participants exported successfully!');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to export participants');
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

  const getStatusBadge = () => {
    if (!seminar) return null;
    if (!seminar.is_active) {
      return <Badge variant="danger" className="text-xs font-bold px-3 py-1 rounded-xl">Inactive</Badge>;
    }
    if (seminar.isClosed) {
      return <Badge variant="warning" className="text-xs font-bold px-3 py-1 rounded-xl">Closed</Badge>;
    }
    const isFull = (seminar.registeredCount || 0) >= (seminar.capacity || 0);
    if (isFull) {
      return <Badge variant="info" className="text-xs font-bold px-3 py-1 rounded-xl">Full</Badge>;
    }
    return <Badge variant="success" className="text-xs font-bold px-3 py-1 rounded-xl">Open</Badge>;
  };

  if (isLoading && !seminar) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 text-[#0C0D0D] animate-spin" />
        <p className="mt-4 text-xs font-bold text-[#0C0D0D]/60">Loading seminar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
        <p className="text-rose-700 font-medium">Error: {error}</p>
        <Button 
          onClick={() => { clearError(); fetchSeminar(id); }}
          className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!seminar) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-[#0C0D0D]/20 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-[#0C0D0D]">Seminar not found</h3>
        <Link href="/dashboard/seminars">
          <Button className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold">
            Back to Seminars
          </Button>
        </Link>
      </div>
    );
  }

  const registeredCount = seminar.registeredCount || 0;
  const capacity = seminar.capacity || 0;
  const attendedCount = participants?.filter(p => p.attended).length || 0;
  const occupancyRate = capacity > 0 ? Math.round((registeredCount / capacity) * 100) : 0;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/seminars"
            className="p-2 rounded-xl hover:bg-[#ECF4EE] transition-colors text-[#0C0D0D]/60 hover:text-[#0C0D0D]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#0C0D0D]">{seminar.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-[#0C0D0D]/60">{seminar.seminar_key}</span>
              <span className="text-[#0C0D0D]/20">•</span>
              {getStatusBadge()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRefresh}
            className="p-2.5 bg-white border border-[#ECF4EE] rounded-xl text-[#0C0D0D]/70 hover:text-[#0C0D0D] hover:border-[#0C0D0D]/20 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link href={`/dashboard/seminars/${id}/edit`}>
            <button className="flex items-center gap-2 bg-white border border-[#ECF4EE] hover:border-[#0C0D0D]/20 px-4 py-2.5 rounded-xl text-xs font-bold text-[#0C0D0D] transition-all">
              <Edit className="h-4 w-4" />
              Edit
            </button>
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 transition-all disabled:opacity-50"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Capacity</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{capacity}</p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">Maximum attendees</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Registered</p>
          <p className={`mt-2 text-3xl font-black tracking-tight ${
            occupancyRate >= 90 ? 'text-rose-600' : occupancyRate >= 70 ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {registeredCount}
          </p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">{occupancyRate}% of capacity</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Attended</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-emerald-600">{attendedCount}</p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">
            {registeredCount > 0 ? Math.round((attendedCount / registeredCount) * 100) : 0}% attendance rate
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Remaining</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{capacity - registeredCount}</p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">Available slots</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details Card */}
        <Card className="lg:col-span-2 p-6 border border-[#ECF4EE]">
          <h3 className="font-bold text-[#0C0D0D] mb-4">Seminar Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold text-[#0C0D0D]/40 uppercase tracking-wider">Day</p>
              <p className="text-sm font-bold text-[#0C0D0D] mt-1">{getDayLabel(seminar.day)}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#0C0D0D]/40 uppercase tracking-wider">Date</p>
              <p className="text-sm font-bold text-[#0C0D0D] mt-1">
                {seminar.date ? new Date(seminar.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }) : 'TBD'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#0C0D0D]/40 uppercase tracking-wider">Time</p>
              <p className="text-sm font-bold text-[#0C0D0D] mt-1">
                {seminar.start_time} - {seminar.end_time}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#0C0D0D]/40 uppercase tracking-wider">Category</p>
              <p className="text-sm font-bold text-[#0C0D0D] mt-1">{seminar.category || 'Uncategorized'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#0C0D0D]/40 uppercase tracking-wider">Building</p>
              <p className="text-sm font-bold text-[#0C0D0D] mt-1">{seminar.building || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#0C0D0D]/40 uppercase tracking-wider">Room</p>
              <p className="text-sm font-bold text-[#0C0D0D] mt-1">{seminar.room || 'N/A'}</p>
            </div>
          </div>
          {seminar.description && (
            <div className="mt-4 pt-4 border-t border-[#ECF4EE]">
              <p className="text-xs font-bold text-[#0C0D0D]/40 uppercase tracking-wider">Description</p>
              <p className="text-sm text-[#0C0D0D]/80 mt-1">{seminar.description}</p>
            </div>
          )}
        </Card>

        {/* Quick Actions Card */}
        <Card className="p-6 border border-[#ECF4EE] bg-gradient-to-br from-[#ECF4EE]/50 to-[#ECF4EE]/30">
          <h3 className="font-bold text-[#0C0D0D] mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link href={`/dashboard/seminars/${id}/participants`}>
              <button className="w-full flex items-center gap-3 bg-white hover:bg-[#ECF4EE] transition-colors p-3 rounded-xl border border-[#ECF4EE]">
                <div className="p-2 rounded-xl bg-[#ECF4EE] text-[#0C0D0D]">
                  <UserPlus className="h-4 w-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-[#0C0D0D]">Manage Participants</p>
                  <p className="text-[10px] text-[#0C0D0D]/50">Register & check-in attendees</p>
                </div>
              </button>
            </Link>
            
            {/* Export Button - Updated with functionality */}
            <button 
              onClick={handleExportParticipantsCSV}
              disabled={isExporting || participants.length === 0}
              className="w-full flex items-center gap-3 bg-white hover:bg-[#ECF4EE] transition-colors p-3 rounded-xl border border-[#ECF4EE] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="p-2 rounded-xl bg-[#ECF4EE] text-[#0C0D0D]">
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </div>
              <div className="text-left flex-1">
                <p className="text-xs font-bold text-[#0C0D0D]">
                  {isExporting ? `Exporting... ${exportProgress}%` : 'Export Participants CSV'}
                </p>
                <p className="text-[10px] text-[#0C0D0D]/50">
                  {isExporting 
                    ? 'Please wait...' 
                    : participants.length > 0 
                      ? `Download ${participants.length} participants` 
                      : 'No participants to export'}
                </p>
              </div>
              {!isExporting && participants.length > 0 && (
                <Badge variant="info" className="text-[10px] font-bold px-2 py-0.5 rounded-lg">
                  CSV
                </Badge>
              )}
            </button>

            <button className="w-full flex items-center gap-3 bg-white hover:bg-[#ECF4EE] transition-colors p-3 rounded-xl border border-[#ECF4EE]">
              <div className="p-2 rounded-xl bg-[#ECF4EE] text-[#0C0D0D]">
                <BarChart3 className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[#0C0D0D]">View Analytics</p>
                <p className="text-[10px] text-[#0C0D0D]/50">Detailed session insights</p>
              </div>
            </button>
          </div>

          {/* Export Progress Bar - Shows when exporting */}
          {isExporting && (
            <div className="mt-4 pt-4 border-t border-[#ECF4EE]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[#0C0D0D]/60">Exporting...</span>
                <span className="text-xs font-bold text-[#0C0D0D]/60">{exportProgress}%</span>
              </div>
              <div className="w-full bg-[#ECF4EE] rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-1.5 bg-[#0C0D0D] rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Participants Section */}
      <Card className="p-6 border border-[#ECF4EE]">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0C0D0D]">Participants</h3>
              <p className="text-xs text-[#0C0D0D]/60 font-medium">
                {participants.length} registered • {participants.filter(p => p.attended).length} attended
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={showParticipants}
              onChange={(e) => setShowParticipants(e.target.value as any)}
              className="px-4 py-2 bg-white border border-[#ECF4EE] rounded-xl text-xs font-medium text-[#0C0D0D] focus:outline-none focus:border-[#0C0D0D]/30"
            >
              <option value="all">All</option>
              <option value="attended">Attended</option>
              <option value="not-attended">Not Attended</option>
            </select>
            
            {/* Quick Export Button in Participants Header */}
            {participants.length > 0 && (
              <button
                onClick={handleExportParticipantsCSV}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#ECF4EE] hover:bg-[#d2e5d7] rounded-xl text-xs font-bold text-[#0C0D0D] transition-colors disabled:opacity-50"
              >
                {isExporting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Export CSV
              </button>
            )}
          </div>
        </div>

        {participants.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 text-[#0C0D0D]/20 mx-auto mb-3" />
            <p className="text-sm font-medium text-[#0C0D0D]/60">No participants registered yet</p>
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
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">Checked In</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECF4EE]">
                {participants.map((participant, index) => (
                  <tr key={participant.attendeeId} className="hover:bg-[#ECF4EE]/20 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-[#0C0D0D]/40">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-bold text-[#0C0D0D]">{participant.fullName}</td>
                    <td className="px-4 py-3 text-xs text-[#0C0D0D]/60">{participant.unique_id}</td>
                    <td className="px-4 py-3 text-xs text-[#0C0D0D]/60">{participant.region}</td>
                    <td className="px-4 py-3">
                      {participant.attended ? (
                        <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border-emerald-200">
                          <CheckCircle className="h-3 w-3 inline mr-1" />
                          Attended
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border-rose-200">
                          <XCircle className="h-3 w-3 inline mr-1" />
                          Not Attended
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#0C0D0D]/60">
                      {participant.attendedAt ? new Date(participant.attendedAt).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}