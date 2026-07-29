// src/app/dashboard/check-in/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  UserCheck,
  Loader2,
  Search,
  X,
  Check,
  ArrowRight,
  Fingerprint,
  AlertCircle,
  CheckCircle2,
  Clock,
  BookOpen,
  Repeat,
} from 'lucide-react';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Avatar } from '@/src/components/ui/Avatar';
import { useCheckin } from '@/src/hooks/useCheckin';
import { useSeminar } from '@/src/hooks/useSeminar';
import { toast } from 'sonner';
import { AttendeeSearchResult } from '@/src/types/checkin.types';
import { Seminar, Participant } from '@/src/types/seminar.types';
import { 
  ArrivalCheckInResponse,
  SessionCheckInResponse,
  SeminarCheckInResponse,
} from '@/src/types/checkin.types';

type CheckinType = 'arrival' | 'session' | 'seminar';

interface CheckinOption {
  id: CheckinType;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

interface SeminarOption {
  value: string;
  label: string;
  isFull: boolean;
  registered: number;
  capacity: number;
}

type CheckInResult = ArrivalCheckInResponse | SessionCheckInResponse | SeminarCheckInResponse | null;

const CHECKIN_OPTIONS: CheckinOption[] = [
  {
    id: 'arrival',
    label: 'Arrival Check-in',
    icon: <UserCheck className="h-5 w-5" />,
    description: 'Check-in student arrival and assign room',
    color: 'bg-emerald-500',
  },
  {
    id: 'session',
    label: 'Session Attendance',
    icon: <Clock className="h-5 w-5" />,
    description: 'Mark attendance for a session',
    color: 'bg-blue-500',
  },
  {
    id: 'seminar',
    label: 'Seminar Attendance',
    icon: <BookOpen className="h-5 w-5" />,
    description: 'Check-in registered participants to seminar',
    color: 'bg-purple-500',
  },
];

export default function CheckInPage() {
  const {
    searchByNLS,
    checkInArrival,
    checkInSession,
    checkInSeminar,
    isCheckingIn,
  } = useCheckin();

  const {
    seminars,
    isLoading: seminarsLoading,
    error: seminarsError,
    refetch: refetchSeminars,
    fetchParticipants,
  } = useSeminar(false);

  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [checkinType, setCheckinType] = useState<CheckinType>('arrival');
  const [nlsIdInput, setNlsIdInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundAttendee, setFoundAttendee] = useState<AttendeeSearchResult | null>(null);
  const [checkinStep, setCheckinStep] = useState<'select' | 'input' | 'confirm' | 'success'>('select');
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedSeminarId, setSelectedSeminarId] = useState('');
  const [checkinResult, setCheckinResult] = useState<CheckInResult>(null);
  const [isCheckingParticipant, setIsCheckingParticipant] = useState(false);
  const [participantStatus, setParticipantStatus] = useState<'registered' | 'not-registered' | 'already-attended' | null>(null);
  const [lastCheckedInName, setLastCheckedInName] = useState<string | null>(null);
  const [isLoadingSeminars, setIsLoadingSeminars] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch seminars when modal opens for seminar check-in
  useEffect(() => {
    let isMounted = true;
    
    if (checkinModalOpen && checkinType === 'seminar' && seminars.length === 0) {
      const loadSeminars = async () => {
        if (isMounted) {
          setIsLoadingSeminars(true);
        }
        try {
          await refetchSeminars({ isActive: true });
        } catch (error) {
          console.error('Error fetching seminars:', error);
        } finally {
          if (isMounted) {
            setIsLoadingSeminars(false);
          }
        }
      };
      loadSeminars();
    }
    
    return () => {
      isMounted = false;
    };
  }, [checkinModalOpen, checkinType, seminars.length, refetchSeminars]);

  // Derive selected seminar details from seminars + selectedSeminarId
  const selectedSeminarDetails = useMemo(() => {
    if (!selectedSeminarId || seminars.length === 0) return null;
    return seminars.find((s: Seminar) => s._id === selectedSeminarId) || null;
  }, [selectedSeminarId, seminars]);

  // Fetch participants when a seminar is selected
  useEffect(() => {
    if (selectedSeminarId && selectedSeminarDetails) {
      fetchParticipants(selectedSeminarId);
    }
  }, [selectedSeminarId, selectedSeminarDetails, fetchParticipants]);

  // Focus input when modal opens
  useEffect(() => {
    if (checkinModalOpen && checkinStep === 'input') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [checkinModalOpen, checkinStep]);

  const handleOpenCheckinModal = (type: CheckinType = 'arrival') => {
    setCheckinType(type);
    setCheckinModalOpen(true);
    
    if (type === 'seminar') {
      setCheckinStep('select');
    } else {
      setCheckinStep('input');
    }
    
    setNlsIdInput('');
    setFoundAttendee(null);
    setCheckinError(null);
    setSelectedSessionId('');
    setSelectedSeminarId('');
    setCheckinResult(null);
    setParticipantStatus(null);
    setLastCheckedInName(null);
    setIsLoadingSeminars(false);

    if (type === 'seminar' && seminars.length === 0) {
      setIsLoadingSeminars(true);
      refetchSeminars({ isActive: true }).finally(() => {
        setIsLoadingSeminars(false);
      });
    }
  };

  const handleCloseCheckinModal = () => {
    setCheckinModalOpen(false);
    setCheckinStep('select');
    setNlsIdInput('');
    setFoundAttendee(null);
    setCheckinError(null);
    setCheckinResult(null);
    
    setParticipantStatus(null);
    setLastCheckedInName(null);
    setIsLoadingSeminars(false);
  };

  const handleSeminarSelect = () => {
    if (!selectedSeminarId) {
      toast.error('Please select a seminar');
      return;
    }
    setCheckinStep('input');
    setCheckinError(null);
    setNlsIdInput('');
    setLastCheckedInName(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleResetForNext = () => {
    setCheckinStep('select');
    setNlsIdInput('');
    setFoundAttendee(null);
    setCheckinError(null);
    setCheckinResult(null);
    setParticipantStatus(null);
    setLastCheckedInName(null);
    if (selectedSeminarId) {
      fetchParticipants(selectedSeminarId);
    }
  };

  const handleNlsIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nlsIdInput.trim()) {
      toast.error('Please enter an NLS ID');
      return;
    }

    setIsSearching(true);
    setCheckinError(null);

    try {
      const results = await searchByNLS(nlsIdInput.trim());
      
      if (!results || results.length === 0) {
        setCheckinError('No attendee found with that NLS ID');
        toast.error('No attendee found with that NLS ID');
        return;
      }

      const attendee = results[0];
      setFoundAttendee(attendee);

      if (checkinType === 'seminar' && selectedSeminarDetails) {
        const participants: Participant[] = selectedSeminarDetails.participants || [];
        const isRegistered = participants.some(
          (p: Participant) => p.unique_id === attendee.unique_id
        );
        
        if (isRegistered) {
          const alreadyAttended = participants.some(
            (p: Participant) => p.unique_id === attendee.unique_id && p.attended === true
          );
          
          if (alreadyAttended) {
            setParticipantStatus('already-attended');
            setCheckinError(`${attendee.first_name} ${attendee.last_name} already checked in`);
            toast.warning(`${attendee.first_name} ${attendee.last_name} already checked in`);
            return;
          }
          
          setParticipantStatus('registered');
          setCheckinStep('confirm');
          toast.success(`${attendee.first_name} ${attendee.last_name} is registered`);
        } else {
          setParticipantStatus('not-registered');
          setCheckinError(`${attendee.first_name} ${attendee.last_name} is not registered`);
          toast.error(`${attendee.first_name} ${attendee.last_name} is not registered`);
        }
      } else {
        setCheckinStep('confirm');
        toast.success(`Found ${attendee.first_name} ${attendee.last_name}`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to find attendee. Please try again.';
      setCheckinError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSeminarCheckin = useCallback(async () => {
    if (!foundAttendee || !selectedSeminarId) return;

    setIsCheckingParticipant(true);
    setCheckinError(null);

    try {
      const result = await checkInSeminar(selectedSeminarId, foundAttendee.unique_id, 'manual');
      
      setCheckinResult(result);
      
      if (result?.data?.attendee) {
        const attendee = result.data.attendee as Partial<AttendeeSearchResult> & { full_name?: string; first_name?: string; last_name?: string; dorm_cache?: AttendeeSearchResult['dorm_cache'] };
        setFoundAttendee({
          ...foundAttendee,
          ...attendee,
        } as AttendeeSearchResult);
        setLastCheckedInName(attendee.full_name || `${attendee.first_name ?? ''} ${attendee.last_name ?? ''}`.trim());
      }
      
      setCheckinStep('success');
      toast.success(`${foundAttendee.first_name} ${foundAttendee.last_name} checked in!`);
      
      await fetchParticipants(selectedSeminarId);
    } catch (err: unknown) {
      console.error('Seminar check-in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to check in';
      setCheckinError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCheckingParticipant(false);
    }
  }, [foundAttendee, selectedSeminarId, checkInSeminar, fetchParticipants]);

  const handleConfirmCheckin = useCallback(async () => {
    if (!foundAttendee) return;

    try {
      let result;
      
      switch (checkinType) {
        case 'arrival':
          result = await checkInArrival(foundAttendee._id, 'manual');
          break;
        case 'session':
          if (!selectedSessionId) {
            toast.error('Please select a session');
            return;
          }
          result = await checkInSession(selectedSessionId, foundAttendee.unique_id, 'manual');
          break;
        case 'seminar':
          await handleSeminarCheckin();
          return;
        default:
          return;
      }
      
      setCheckinResult(result);
      
      if (result?.data?.attendee) {
        const attendeeData = result.data.attendee as Partial<AttendeeSearchResult> & { full_name?: string; first_name?: string; last_name?: string; dorm_cache?: AttendeeSearchResult['dorm_cache'] };
        setFoundAttendee({
          ...foundAttendee,
          ...attendeeData,
          dorm_cache: attendeeData.dorm_cache || foundAttendee.dorm_cache,
        } as AttendeeSearchResult);
        setLastCheckedInName(attendeeData.first_name
          ? `${attendeeData.first_name} ${attendeeData.last_name ?? ''}`.trim()
          : attendeeData.full_name || '');
      }
      
      setCheckinStep('success');
      toast.success(`${foundAttendee.first_name} ${foundAttendee.last_name} checked in!`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Check-in failed';
      toast.error(errorMessage);
      setCheckinError(errorMessage);
    }
  }, [foundAttendee, checkinType, checkInArrival, checkInSession, handleSeminarCheckin, selectedSessionId]);

  const getCheckinColor = () => {
    switch (checkinType) {
      case 'arrival': return 'bg-emerald-500';
      case 'session': return 'bg-blue-500';
      case 'seminar': return 'bg-purple-500';
      default: return 'bg-[#0C0D0D]';
    }
  };

  const getCheckinLabel = () => {
    switch (checkinType) {
      case 'arrival': return 'Arrival Check-in';
      case 'session': return 'Session Attendance';
      case 'seminar': return 'Seminar Attendance';
      default: return 'Check-in';
    }
  };

  // Derived display attendee type to handle different response shapes
  type DisplayAttendee = AttendeeSearchResult | {
    _id: string;
    unique_id: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    dorm_cache?: AttendeeSearchResult['dorm_cache'];
  } | null;

  const getDisplayAttendee = (): DisplayAttendee => {
    if (checkinResult?.data?.attendee) {
      const attendee = checkinResult.data.attendee as Partial<AttendeeSearchResult> & {
        full_name?: string;
        first_name?: string;
        last_name?: string;
        dorm_cache?: AttendeeSearchResult['dorm_cache'];
      };

      if (attendee.first_name) {
        return attendee as AttendeeSearchResult;
      }

      return {
        _id: attendee._id || '',
        unique_id: attendee.unique_id || '',
        full_name: attendee.full_name,
        first_name: attendee.first_name,
        last_name: attendee.last_name,
        dorm_cache: attendee.dorm_cache,
      };
    }

    return foundAttendee;
  };

  const displayAttendee = getDisplayAttendee();

  const seminarOptions: SeminarOption[] = seminars.map((s: Seminar) => {
    const participants = s.participants || [];
    const registered = participants.length;
    const capacity = s.capacity || 0;
    const isFull = registered >= capacity;
    const status = isFull ? '🔴 Full' : `🟢 ${registered}/${capacity}`;
    
    return {
      value: s._id,
      label: `${s.name} (Day ${s.day}) - ${status}`,
      isFull,
      registered,
      capacity,
    };
  });

  // Narrowed check-in response pieces for safe property access in JSX
  const seminarData = (checkinResult?.data as SeminarCheckInResponse['data'])?.seminar;
  const sessionData = (checkinResult?.data as SessionCheckInResponse['data'])?.session;
  const checkInData = (checkinResult?.data as SessionCheckInResponse['data'] | SeminarCheckInResponse['data'])?.check_in;

  const getParticipantStatusBadge = () => {
    if (participantStatus === 'registered') {
      return <Badge variant="success" className="bg-emerald-100 text-emerald-700 border-emerald-200">✅ Registered</Badge>;
    } else if (participantStatus === 'already-attended') {
      return <Badge variant="warning" className="bg-amber-100 text-amber-700 border-amber-200">⚠️ Already Attended</Badge>;
    } else if (participantStatus === 'not-registered') {
      return <Badge variant="danger" className="bg-rose-100 text-rose-700 border-rose-200">❌ Not Registered</Badge>;
    }
    return null;
  };

  const isProcessing = isCheckingIn || isCheckingParticipant;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl w-full">
        {CHECKIN_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => handleOpenCheckinModal(option.id)}
            className="group flex flex-col items-center gap-3 p-6 rounded-3xl bg-white border border-[#ECF4EE] hover:border-[#0C0D0D]/20 hover:shadow-lg transition-all duration-200 active:scale-95"
          >
            <div className={`p-4 rounded-2xl ${option.color} text-white shadow-lg group-hover:scale-110 transition-transform`}>
              {option.icon}
            </div>
            <div className="text-center">
              <h3 className="font-extrabold text-[#0C0D0D] text-sm">{option.label}</h3>
              <p className="text-xs text-[#0C0D0D]/50 font-medium mt-0.5">{option.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ==================== CHECK-IN MODAL ==================== */}
      {checkinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C0D0D]/70 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-white">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[#0C0D0D]/5 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-2xl ${getCheckinColor()} text-white`}>
                  {checkinType === 'arrival' && <UserCheck className="h-5 w-5" />}
                  {checkinType === 'session' && <Clock className="h-5 w-5" />}
                  {checkinType === 'seminar' && <BookOpen className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-[#0C0D0D]">{getCheckinLabel()}</h3>
                  <p className="text-xs text-[#0C0D0D]/50 font-medium">
                    {checkinStep === 'select' && 'Select a seminar'}
                    {checkinStep === 'input' && 'Enter NLS ID'}
                    {checkinStep === 'confirm' && 'Verify student information'}
                    {checkinStep === 'success' && 'Check-in complete!'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseCheckinModal}
                className="p-1.5 rounded-full hover:bg-[#ECF4EE] text-[#0C0D0D]/40 hover:text-[#0C0D0D] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Step 1: Select Seminar */}
              {checkinStep === 'select' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#ECF4EE] rounded-full flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="h-8 w-8 text-[#0C0D0D]" />
                    </div>
                    <p className="text-sm text-[#0C0D0D]/60 font-medium">
                      Select the seminar you want to check in participants for
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                      Select Seminar <span className="text-rose-500">*</span>
                    </label>
                    {isLoadingSeminars || seminarsLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 text-[#0C0D0D] animate-spin" />
                      </div>
                    ) : seminarOptions.length === 0 ? (
                      <div className="text-center py-4 text-sm text-[#0C0D0D]/50">
                        {seminarsError ? 'Error loading seminars' : 'No seminars available'}
                      </div>
                    ) : (
                      <select
                        value={selectedSeminarId}
                        onChange={(e) => setSelectedSeminarId(e.target.value)}
                        className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all appearance-none"
                      >
                        <option value="">Select a seminar...</option>
                        {seminarOptions.map((opt: SeminarOption) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {selectedSeminarDetails && (
                      <div className="mt-3 p-3 bg-[#FAFAFA] rounded-xl border border-[#0C0D0D]/5">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#0C0D0D]/60">Registered</span>
                          <span className="font-bold text-[#0C0D0D]">
                            {selectedSeminarDetails.participants?.length || 0} / {selectedSeminarDetails.capacity || 0}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-[#0C0D0D]/60">Status</span>
                          <span className={`font-bold ${
                            (selectedSeminarDetails.participants?.length || 0) >= (selectedSeminarDetails.capacity || 0)
                              ? 'text-rose-600'
                              : 'text-emerald-600'
                          }`}>
                            {(selectedSeminarDetails.participants?.length || 0) >= (selectedSeminarDetails.capacity || 0)
                              ? '🔴 Full'
                              : '🟢 Available'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleSeminarSelect}
                    disabled={!selectedSeminarId}
                    className="w-full bg-[#0C0D0D] hover:bg-[#0C0D0D]/90 text-white rounded-2xl py-3 font-extrabold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Continue to Check-in
                  </Button>
                </div>
              )}

              {/* Step 2: Input NLS ID */}
              {checkinStep === 'input' && (
                <form onSubmit={handleNlsIdSubmit} className="space-y-4">
                  {checkinType === 'seminar' && selectedSeminarDetails && (
                    <div className="bg-[#ECF4EE] rounded-xl p-3 text-center">
                      <p className="text-xs text-[#0C0D0D]/60">Checking in to</p>
                      <p className="text-sm font-bold text-[#0C0D0D]">{selectedSeminarDetails.name}</p>
                      <p className="text-xs text-[#0C0D0D]/50">Day {selectedSeminarDetails.day}</p>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#ECF4EE] rounded-full flex items-center justify-center mx-auto mb-3">
                      <Fingerprint className="h-8 w-8 text-[#0C0D0D]" />
                    </div>
                    <p className="text-sm text-[#0C0D0D]/60 font-medium">
                      {checkinType === 'seminar' 
                        ? 'Enter NLS ID of registered participant'
                        : 'Enter the student\'s NLS ID'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                      NLS ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      ref={inputRef}
                      type="text"
                      value={nlsIdInput}
                      onChange={(e) => setNlsIdInput(e.target.value.toUpperCase())}
                      placeholder="e.g., NLS-2026-001 or 001"
                      className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all placeholder:text-[#0C0D0D]/40 font-mono text-center"
                      autoFocus
                    />
                    <p className="text-xs text-[#0C0D0D]/40 mt-1.5 text-center">
                      Enter full ID or just the number (e.g., 001)
                    </p>
                  </div>

                  {checkinType === 'session' && (
                    <div>
                      <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                        Select Session <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={selectedSessionId}
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                        className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all appearance-none"
                      >
                        <option value="">Select a session...</option>
                        <option value="session-1">Session 1: Morning Worship</option>
                        <option value="session-2">Session 2: Teaching</option>
                        <option value="session-3">Session 3: Workshop</option>
                      </select>
                    </div>
                  )}

                  {checkinError && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-rose-600 font-medium">{checkinError}</p>
                    </div>
                  )}

                  {checkinType === 'seminar' && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setCheckinStep('select');
                        setNlsIdInput('');
                        setCheckinError(null);
                      }}
                      className="w-full rounded-2xl border-[#0C0D0D]/10 bg-[#FAFAFA] text-[#0C0D0D] font-bold"
                    >
                      ← Back to Seminar Selection
                    </Button>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSearching}
                    className="w-full bg-[#0C0D0D] hover:bg-[#0C0D0D]/90 text-white rounded-2xl py-3 font-extrabold"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        {checkinType === 'seminar' ? 'Check Participant' : 'Find Student'}
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* Step 3: Confirm */}
              {checkinStep === 'confirm' && foundAttendee && (
                <div className="space-y-5">
                  <div className={`rounded-2xl p-5 border text-center ${getCheckinColor().replace('bg-', 'bg-').replace('500', '50')} border-[#0C0D0D]/10`}>
                    <Avatar 
                      name={`${foundAttendee.first_name} ${foundAttendee.last_name}`} 
                      size="lg" 
                      className="ring-4 ring-white shadow-md mx-auto mb-3"
                    />
                    <h4 className="text-xl font-extrabold text-[#0C0D0D]">
                      {foundAttendee.first_name} {foundAttendee.last_name}
                    </h4>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-sm font-mono font-bold px-3 py-1 rounded-lg bg-white/70 text-[#0C0D0D] border border-[#0C0D0D]/10">
                        {foundAttendee.unique_id}
                      </span>
                    </div>
                  </div>

                  {checkinType === 'seminar' && selectedSeminarDetails && (
                    <div className="text-center space-y-2">
                      <div className="text-xs text-[#0C0D0D]/60">
                        <span className="font-bold">Seminar:</span> {selectedSeminarDetails.name} (Day {selectedSeminarDetails.day})
                      </div>
                      <div className="flex justify-center">
                        {getParticipantStatusBadge()}
                      </div>
                    </div>
                  )}

                  {checkinType === 'session' && selectedSessionId && (
                    <div className="text-center text-xs text-[#0C0D0D]/60">
                      <span className="font-bold">Session:</span>{' '}
                      {selectedSessionId === 'session-1' ? 'Morning Worship' :
                       selectedSessionId === 'session-2' ? 'Teaching' :
                       selectedSessionId === 'session-3' ? 'Workshop' : 'Selected'}
                    </div>
                  )}

                  <div className="text-center">
                    <Badge variant="info" className={`${getCheckinColor()} text-white border-0 px-3 py-1`}>
                      {getCheckinLabel()}
                    </Badge>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setCheckinStep('input');
                        setFoundAttendee(null);
                        setNlsIdInput('');
                        setCheckinError(null);
                        setParticipantStatus(null);
                        setTimeout(() => inputRef.current?.focus(), 100);
                      }}
                      className="flex-1 rounded-2xl border-[#0C0D0D]/10 bg-[#FAFAFA] text-[#0C0D0D] font-bold"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleConfirmCheckin}
                      disabled={isProcessing}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-3 font-extrabold"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {isCheckingParticipant ? 'Checking in...' : 'Processing...'}
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Confirm
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Success */}
              {checkinStep === 'success' && displayAttendee && (
                <div className="text-center py-6 space-y-4">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-[#0C0D0D]">Check-in Complete!</h3>
                    <p className="text-sm text-[#0C0D0D]/60 mt-1">
                      {displayAttendee.first_name || displayAttendee.full_name || 'Student'} checked in successfully
                    </p>
                    <Badge variant="info" className={`mt-2 ${getCheckinColor()} text-white border-0 px-3 py-1`}>
                      {getCheckinLabel()}
                    </Badge>
                  </div>

                  <div className="bg-[#ECF4EE] rounded-2xl p-4 border border-[#0C0D0D]/10 text-left space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#0C0D0D]/60">NLS ID</span>
                      <span className="font-bold text-[#0C0D0D]">{displayAttendee.unique_id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#0C0D0D]/60">Name</span>
                      <span className="font-bold text-[#0C0D0D]">
                        {displayAttendee.first_name || displayAttendee.full_name || 'Student'}
                      </span>
                    </div>

                    {checkinType === 'seminar' && seminarData && (
                      <div className="flex justify-between text-sm border-t border-[#0C0D0D]/10 pt-1.5 mt-1">
                        <span className="text-[#0C0D0D]/60">Seminar</span>
                        <span className="font-bold text-[#0C0D0D]">{seminarData?.name}</span>
                      </div>
                    )}
                    {checkinType === 'session' && sessionData && (
                      <div className="flex justify-between text-sm border-t border-[#0C0D0D]/10 pt-1.5 mt-1">
                        <span className="text-[#0C0D0D]/60">Session</span>
                        <span className="font-bold text-[#0C0D0D]">{sessionData?.name}</span>
                      </div>
                    )}
                    {checkInData && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#0C0D0D]/60">Status</span>
                        <span className={`font-bold ${
                          checkInData.status === 'on_time' ? 'text-emerald-600' :
                          checkInData.status === 'late' ? 'text-amber-600' :
                          'text-rose-600'
                        }`}>
                          {checkInData.status === 'on_time' ? '✅ On Time' :
                           checkInData.status === 'late' ? '⚠️ Late' :
                           '❌ Absent'}
                        </span>
                      </div>
                    )}

                    {checkinType === 'arrival' && displayAttendee?.dorm_cache && (
                      <>
                        <div className="flex justify-between text-sm border-t border-[#0C0D0D]/10 pt-1.5 mt-1">
                          <span className="text-[#0C0D0D]/60">Building</span>
                          <span className="font-bold text-[#0C0D0D]">
                            {displayAttendee.dorm_cache?.buildingName || 'Not assigned'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#0C0D0D]/60">Floor</span>
                          <span className="font-bold text-[#0C0D0D]">
                            {displayAttendee.dorm_cache?.floor || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#0C0D0D]/60">Room</span>
                          <span className="font-bold text-[#0C0D0D]">
                            {displayAttendee.dorm_cache?.roomNumber || 'Not assigned'}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#0C0D0D]/60">Bed</span>
                          <span className="font-bold text-[#0C0D0D]">
                            {displayAttendee.dorm_cache?.bedNumber || 'N/A'}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between text-sm border-t border-[#0C0D0D]/10 pt-1.5 mt-1">
                      <span className="text-[#0C0D0D]/60">Time</span>
                      <span className="font-bold text-[#0C0D0D]">{new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      onClick={handleCloseCheckinModal}
                      className="flex-1 bg-[#0C0D0D] hover:bg-[#0C0D0D]/90 text-white rounded-2xl py-3 font-extrabold"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Done
                    </Button>
                    
                    {checkinType === 'seminar' && (
                      <Button
                        variant="primary"
                        onClick={handleResetForNext}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-3 font-extrabold"
                      >
                        <Repeat className="h-4 w-4 mr-2" />
                        Check Another
                      </Button>
                    )}
                  </div>

                  {checkinType === 'seminar' && lastCheckedInName && (
                    <p className="text-xs text-[#0C0D0D]/40 mt-2">
                      Last checked in: <span className="font-bold text-[#0C0D0D]">{lastCheckedInName}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}