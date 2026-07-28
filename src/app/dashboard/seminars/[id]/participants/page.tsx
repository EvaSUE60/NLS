// src/app/dashboard/seminars/[id]/participants/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  UserPlus,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Users,
  QrCode,
  Scan,
  X,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { useSeminar } from '@/src/hooks/useSeminar';
import { useAttendee } from '@/src/hooks/useAttendee';
import { toast } from 'sonner';

interface ParticipantsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ParticipantsPage({ params }: ParticipantsPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const {
    selectedSeminar: seminar,
    participants,
    participantsStats,
    isLoading,
    fetchSeminar,
    fetchParticipants,
    register,
    checkIn,
    clearSelected,
  } = useSeminar();
  
  // ✅ Use the attendee hook with correct exports
  const { 
    attendees, 
    fetch, // ✅ Use 'fetch' instead of 'fetchAttendees'
    isLoading: attendeesLoading,
    error: attendeeError,
  } = useAttendee();

  const [searchQuery, setSearchQuery] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState<string | null>(null);
  const [showAttended, setShowAttended] = useState<'all' | 'attended' | 'not-attended'>('all');

  // Fetch data on mount
  useEffect(() => {
    fetchSeminar(id);
    fetchParticipants(id);
    fetch(); // ✅ Now using 'fetch' from the hook
    return () => clearSelected();
  }, [id]);

  // Refetch participants when filter changes
  useEffect(() => {
    if (seminar) {
      fetchParticipants(id, showAttended === 'all' ? undefined : showAttended === 'attended');
    }
  }, [showAttended, seminar]);

  const handleRegister = async () => {
    if (!selectedAttendee) {
      toast.error('Please select an attendee');
      return;
    }

    setIsRegistering(true);
    try {
      await register(id, selectedAttendee);
      toast.success('Attendee registered successfully');
      setShowRegisterModal(false);
      setSelectedAttendee('');
      await fetchParticipants(id);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to register attendee');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCheckIn = async (nlsId: string, attendeeName: string) => {
    setIsCheckingIn(nlsId);
    try {
      await checkIn(id, nlsId, 'manual');
      toast.success(`${attendeeName} checked in successfully`);
      await fetchParticipants(id);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to check in attendee');
    } finally {
      setIsCheckingIn(null);
    }
  };

  const filteredParticipants = participants.filter(p =>
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.unique_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get unregistered attendees (those not in participants list)
  const registeredIds = new Set(participants.map(p => p.attendeeId));
  const unregisteredAttendees = attendees.filter(a => !registeredIds.has(a._id));

  if (isLoading && !seminar) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-10 w-10 text-[#0C0D0D] animate-spin" />
        <p className="mt-4 text-xs font-bold text-[#0C0D0D]/60">Loading...</p>
      </div>
    );
  }

  if (!seminar) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-[#0C0D0D]/20 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-[#0C0D0D]">Seminar not found</h3>
        <Link href="/dashboard/seminars">
          <Button className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold">
            Back to Seminars
          </Button>
        </Link>
      </div>
    );
  }

  const registeredCount = participants.length;
  const attendedCount = participants.filter(p => p.attended).length;
  const notAttendedCount = registeredCount - attendedCount;
  const remainingSlots = (seminar.capacity || 0) - registeredCount;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/seminars/${id}`}
            className="p-2 rounded-xl hover:bg-[#ECF4EE] transition-colors text-[#0C0D0D]/60 hover:text-[#0C0D0D]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#0C0D0D]">Manage Participants</h1>
            <p className="text-xs text-[#0C0D0D]/60 font-medium">
              {seminar.name} • {seminar.seminar_key}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              fetchParticipants(id);
              fetch();
              toast.success('Refreshed');
            }}
            className="p-2.5 bg-white border border-[#ECF4EE] rounded-xl text-[#0C0D0D]/70 hover:text-[#0C0D0D] hover:border-[#0C0D0D]/20 transition-all"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowRegisterModal(true)}
            disabled={remainingSlots <= 0}
            className="flex items-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="h-4 w-4" />
            Register Attendee
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#ECF4EE] p-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Registered</p>
          <p className="text-2xl font-black text-[#0C0D0D]">{registeredCount}</p>
          <p className="text-xs text-[#0C0D0D]/50">of {seminar.capacity} capacity</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#ECF4EE] p-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Attended</p>
          <p className="text-2xl font-black text-emerald-600">{attendedCount}</p>
          <p className="text-xs text-[#0C0D0D]/50">{registeredCount > 0 ? Math.round((attendedCount / registeredCount) * 100) : 0}% rate</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#ECF4EE] p-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Not Attended</p>
          <p className="text-2xl font-black text-rose-600">{notAttendedCount}</p>
          <p className="text-xs text-[#0C0D0D]/50">Checked out</p>
        </div>
        <div className="bg-white rounded-2xl border border-[#ECF4EE] p-4 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Remaining</p>
          <p className="text-2xl font-black text-amber-600">{remainingSlots}</p>
          <p className="text-xs text-[#0C0D0D]/50">Available slots</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-center">
        <div className="flex-1 min-w-[200px] w-full relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0C0D0D]/40" />
          <input
            type="text"
            placeholder="Search participants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#ECF4EE] focus:border-[#0C0D0D]/30 rounded-2xl text-xs font-medium text-[#0C0D0D] placeholder-[#0C0D0D]/40 focus:outline-none transition-all"
          />
        </div>

        <select
          value={showAttended}
          onChange={(e) => setShowAttended(e.target.value as any)}
          className="px-4 py-2.5 bg-white border border-[#ECF4EE] rounded-2xl text-xs font-medium text-[#0C0D0D] focus:outline-none focus:border-[#0C0D0D]/30 min-w-[140px]"
        >
          <option value="all">All</option>
          <option value="attended">Attended</option>
          <option value="not-attended">Not Attended</option>
        </select>
      </div>

      {/* Participants List */}
      <Card className="p-6 border border-[#ECF4EE]">
        {filteredParticipants.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 text-[#0C0D0D]/20 mx-auto mb-3" />
            <p className="text-sm font-medium text-[#0C0D0D]/60">
              {searchQuery ? 'No participants match your search' : 'No participants registered yet'}
            </p>
            {!searchQuery && remainingSlots > 0 && (
              <button
                onClick={() => setShowRegisterModal(true)}
                className="mt-3 text-xs font-bold text-[#0C0D0D] hover:underline"
              >
                Register the first attendee
              </button>
            )}
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
                  <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECF4EE]">
                {filteredParticipants.map((participant, index) => (
                  <tr key={participant.attendeeId || index} className="hover:bg-[#ECF4EE]/20 transition-colors">
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
                    <td className="px-4 py-3 text-right">
                      {!participant.attended && (
                        <button
                          onClick={() => handleCheckIn(participant.unique_id, participant.fullName)}
                          disabled={isCheckingIn === participant.unique_id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {isCheckingIn === participant.unique_id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                          Check In
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#ECF4EE] shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0C0D0D]">Register Attendee</h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 rounded-xl hover:bg-[#ECF4EE] transition-colors"
              >
                <X className="h-5 w-5 text-[#0C0D0D]/60" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                  Select Attendee
                </label>
                {attendeesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 text-[#0C0D0D] animate-spin" />
                  </div>
                ) : unregisteredAttendees.length === 0 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <p className="text-sm font-medium text-amber-700">All attendees are already registered</p>
                    <p className="text-xs text-amber-600 mt-1">No available attendees to register</p>
                  </div>
                ) : (
                  <select
                    value={selectedAttendee}
                    onChange={(e) => setSelectedAttendee(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#ECF4EE] focus:border-[#0C0D0D]/30 focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 text-sm font-medium text-[#0C0D0D] bg-white"
                  >
                    <option value="">Choose an attendee...</option>
                    {unregisteredAttendees.map((attendee) => (
                      <option key={attendee._id} value={attendee._id}>
                        {attendee.first_name} {attendee.last_name} ({attendee.unique_id})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleRegister}
                  disabled={!selectedAttendee || isRegistering || unregisteredAttendees.length === 0}
                  className="flex-1 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Register
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 bg-white border border-[#ECF4EE] hover:border-[#0C0D0D]/20 px-4 py-2.5 rounded-xl text-xs font-bold text-[#0C0D0D]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}