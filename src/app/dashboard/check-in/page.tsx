// src/app/dashboard/check-in/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
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
  Calendar,
  Shield,
  Key,
} from 'lucide-react';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Avatar } from '@/src/components/ui/Avatar';
import { useCheckin } from '@/src/hooks/useCheckin';
import { useSeminar } from '@/src/hooks/useSeminar';
import { useSession } from '@/src/hooks/useSession';
import { toast } from 'sonner';
import { AttendeeSearchResult } from '@/src/types/checkin.types';
import { Seminar, Participant } from '@/src/types/seminar.types';
import { Session } from '@/src/types/session.types';
import { 
  SessionCheckInResponse,
  SeminarCheckInResponse,
} from '@/src/types/checkin.types';

type CheckinType = 'session' | 'seminar';

interface CheckinOption {
  id: CheckinType;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

interface SessionOption {
  value: string;
  label: string;
  day: number;
  type: string;
  attendees: number;
  isActive: boolean;
}

type CheckInResult = SessionCheckInResponse | SeminarCheckInResponse | null;

// Session verification codes (in a real app, these would come from an API)
const SESSION_VERIFICATION_CODES: Record<string, string> = {
  // You can define codes per session ID or use a default code
  // Format: 'sessionId': 'code'
  // Example:
  // 'session_123': '1234',
  // 'session_456': '5678',
  // Or use a global code for all sessions:
  // 'default': '1234'
};

const DEFAULT_SESSION_CODE = '2626'; // Default 4-digit code for all sessions

const CHECKIN_OPTIONS: CheckinOption[] = [
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

  const {
    sessions,
    isLoading: sessionsLoading,
    fetchSessions,
  } = useSession();

  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [checkinType, setCheckinType] = useState<CheckinType>('seminar');
  const [nlsIdInput, setNlsIdInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundAttendee, setFoundAttendee] = useState<AttendeeSearchResult | null>(null);
  const [checkinStep, setCheckinStep] = useState<'select' | 'input' | 'verify' | 'confirm' | 'success'>('select');
  const [checkinError, setCheckinError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedSeminarId, setSelectedSeminarId] = useState('');
  const [checkinResult, setCheckinResult] = useState<CheckInResult>(null);
  const [isCheckingParticipant, setIsCheckingParticipant] = useState(false);
  const [participantStatus, setParticipantStatus] = useState<'registered' | 'not-registered' | 'already-attended' | null>(null);
  const [lastCheckedInName, setLastCheckedInName] = useState<string | null>(null);
  const [isLoadingSeminars, setIsLoadingSeminars] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [recentlyCheckedIn, setRecentlyCheckedIn] = useState<Array<{name: string, id: string, time: string}>>([]);
  const [quickCheckinMode, setQuickCheckinMode] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Get unique days from seminars
  const availableDays = useMemo(() => {
    const days = new Set<number>();
    seminars.forEach((s: Seminar) => {
      if (s.day) days.add(s.day);
    });
    return Array.from(days).sort((a, b) => a - b);
  }, [seminars]);

  // Filter seminars by selected day
  const filteredSeminars = useMemo(() => {
    if (!selectedDay) return seminars;
    return seminars.filter((s: Seminar) => s.day === selectedDay);
  }, [seminars, selectedDay]);

  // Fetch sessions when modal opens for session check-in
  useEffect(() => {
    let isMounted = true;
    
    if (checkinModalOpen && checkinType === 'session' && sessions.length === 0) {
      const loadSessions = async () => {
        if (isMounted) {
          setIsLoadingSessions(true);
        }
        try {
          await fetchSessions();
        } catch (error) {
          console.error('Error fetching sessions:', error);
        } finally {
          if (isMounted) {
            setIsLoadingSessions(false);
          }
        }
      };
      loadSessions();
    }
    
    return () => {
      isMounted = false;
    };
  }, [checkinModalOpen, checkinType, sessions.length, fetchSessions]);

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

  // Derive selected seminar details
  const selectedSeminarDetails = useMemo(() => {
    if (!selectedSeminarId || seminars.length === 0) return null;
    return seminars.find((s: Seminar) => s._id === selectedSeminarId) || null;
  }, [selectedSeminarId, seminars]);

  // Derive selected session details
  const selectedSessionDetails = useMemo(() => {
    if (!selectedSessionId || sessions.length === 0) return null;
    return sessions.find((s: Session) => s._id === selectedSessionId) || null;
  }, [selectedSessionId, sessions]);

  // Get verification code for a session
  const getSessionVerificationCode = useCallback((sessionId: string): string => {
    // First check if there's a specific code for this session
    if (SESSION_VERIFICATION_CODES[sessionId]) {
      return SESSION_VERIFICATION_CODES[sessionId];
    }
    // Otherwise use the default code
    return DEFAULT_SESSION_CODE;
  }, []);

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
    if (checkinModalOpen && checkinStep === 'verify') {
      setTimeout(() => codeInputRef.current?.focus(), 100);
    }
  }, [checkinModalOpen, checkinStep]);

  // Reset verification state when session changes
  useEffect(() => {
    setIsVerified(false);
    setVerificationCode('');
    setVerificationAttempts(0);
  }, [selectedSessionId]);

  const handleOpenCheckinModal = (type: CheckinType = 'seminar') => {
    setCheckinType(type);
    setCheckinModalOpen(true);
    setCheckinStep('select');
    setNlsIdInput('');
    setFoundAttendee(null);
    setCheckinError(null);
    setSelectedSessionId('');
    setSelectedSeminarId('');
    setCheckinResult(null);
    setParticipantStatus(null);
    setLastCheckedInName(null);
    setIsLoadingSeminars(false);
    setIsLoadingSessions(false);
    setQuickCheckinMode(false);
    setRecentlyCheckedIn([]);
    setSelectedDay(1);
    setVerificationCode('');
    setIsVerified(false);
    setVerificationAttempts(0);

    if (type === 'seminar' && seminars.length === 0) {
      setIsLoadingSeminars(true);
      refetchSeminars({ isActive: true }).finally(() => {
        setIsLoadingSeminars(false);
      });
    }
    
    if (type === 'session' && sessions.length === 0) {
      setIsLoadingSessions(true);
      fetchSessions().finally(() => {
        setIsLoadingSessions(false);
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
    setIsLoadingSessions(false);
    setQuickCheckinMode(false);
    setRecentlyCheckedIn([]);
    setSelectedDay(1);
    setVerificationCode('');
    setIsVerified(false);
    setVerificationAttempts(0);
  };

  const handleSelectNext = () => {
    if (!selectedSessionId && checkinType === 'session') {
      toast.error('Please select a session');
      return;
    }
    if (!selectedSeminarId && checkinType === 'seminar') {
      toast.error('Please select a seminar');
      return;
    }
    
    // For session check-in, go to verification step first
    if (checkinType === 'session') {
      setCheckinStep('verify');
      setCheckinError(null);
      setVerificationCode('');
      setIsVerified(false);
      setTimeout(() => codeInputRef.current?.focus(), 100);
    } else {
      // For seminar check-in, go directly to input
      setCheckinStep('input');
      setCheckinError(null);
      setNlsIdInput('');
      setLastCheckedInName(null);
      setQuickCheckinMode(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 4) {
      setCheckinError('Please enter a 4-digit verification code');
      toast.error('Please enter a 4-digit verification code');
      return;
    }

    setIsVerifying(true);
    setCheckinError(null);

    try {
      const expectedCode = getSessionVerificationCode(selectedSessionId);
      
      if (verificationCode === expectedCode) {
        setIsVerified(true);
        setVerificationAttempts(0);
        toast.success('Verification successful!');
        // Proceed to check-in
        setCheckinStep('input');
        setCheckinError(null);
        setNlsIdInput('');
        setQuickCheckinMode(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      } else {
        const newAttempts = verificationAttempts + 1;
        setVerificationAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setCheckinError('Too many failed attempts. Please contact an administrator.');
          toast.error('Verification failed. Too many attempts.');
          // Lock the session check-in
          setCheckinStep('select');
          toast.error('Session locked. Please select again or contact support.');
        } else {
          setCheckinError(`Invalid verification code. ${3 - newAttempts} attempts remaining.`);
          toast.error(`Invalid code. ${3 - newAttempts} attempts remaining.`);
          setVerificationCode('');
          setTimeout(() => codeInputRef.current?.focus(), 100);
        }
      }
    } catch (err) {
      setCheckinError('Verification failed. Please try again.');
      toast.error('Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResetForNext = () => {
    setCheckinStep('input');
    setNlsIdInput('');
    setFoundAttendee(null);
    setCheckinError(null);
    setCheckinResult(null);
    setParticipantStatus(null);
    setQuickCheckinMode(true);
    setTimeout(() => inputRef.current?.focus(), 100);
    
    // Refresh data
    if (selectedSeminarId) {
      fetchParticipants(selectedSeminarId);
    }
    if (selectedSessionId) {
      fetchSessions();
    }
  };

  const handleNlsIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nlsIdInput.trim()) {
      toast.error('Please enter an NLS ID');
      return;
    }

    // For session check-in, ensure verification is done
    if (checkinType === 'session' && !isVerified) {
      setCheckinError('Session verification required');
      setCheckinStep('verify');
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
            setTimeout(() => {
              if (quickCheckinMode) {
                handleResetForNext();
              }
            }, 2000);
            return;
          }
          
          setParticipantStatus('registered');
          setCheckinStep('confirm');
          toast.success(`${attendee.first_name} ${attendee.last_name} is registered`);
        } else {
          setParticipantStatus('not-registered');
          setCheckinError(`${attendee.first_name} ${attendee.last_name} is not registered for this seminar`);
          toast.error(`${attendee.first_name} ${attendee.last_name} is not registered`);
          setTimeout(() => {
            if (quickCheckinMode) {
              handleResetForNext();
            }
          }, 2000);
        }
      } else if (checkinType === 'session' && selectedSessionDetails) {
        const attendees = selectedSessionDetails.attendees || [];
        const alreadyAttended = attendees.some(
          (a: any) => a.unique_id === attendee.unique_id
        );
        
        if (alreadyAttended) {
          setCheckinError(`${attendee.first_name} ${attendee.last_name} already attended this session`);
          toast.warning(`${attendee.first_name} ${attendee.last_name} already attended`);
          setTimeout(() => {
            if (quickCheckinMode) {
              handleResetForNext();
            }
          }, 2000);
          return;
        }
        
        setCheckinStep('confirm');
        toast.success(`Found ${attendee.first_name} ${attendee.last_name}`);
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
        const name = attendee.full_name || `${attendee.first_name ?? ''} ${attendee.last_name ?? ''}`.trim();
        setLastCheckedInName(name);
        
        setRecentlyCheckedIn(prev => [
          { name, id: foundAttendee.unique_id, time: new Date().toLocaleTimeString() },
          ...prev.slice(0, 4)
        ]);
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

  const handleSessionCheckin = useCallback(async () => {
    if (!foundAttendee || !selectedSessionId) return;

    setIsCheckingParticipant(true);
    setCheckinError(null);

    try {
      const result = await checkInSession(selectedSessionId, foundAttendee.unique_id, 'manual');
      
      setCheckinResult(result);
      
      if (result?.data?.attendee) {
        const attendee = result.data.attendee as Partial<AttendeeSearchResult> & { full_name?: string; first_name?: string; last_name?: string; dorm_cache?: AttendeeSearchResult['dorm_cache'] };
        setFoundAttendee({
          ...foundAttendee,
          ...attendee,
        } as AttendeeSearchResult);
        const name = attendee.full_name || `${attendee.first_name ?? ''} ${attendee.last_name ?? ''}`.trim();
        setLastCheckedInName(name);
        
        setRecentlyCheckedIn(prev => [
          { name, id: foundAttendee.unique_id, time: new Date().toLocaleTimeString() },
          ...prev.slice(0, 4)
        ]);
      }
      
      setCheckinStep('success');
      toast.success(`${foundAttendee.first_name} ${foundAttendee.last_name} checked in!`);
      
      await fetchSessions();
    } catch (err: unknown) {
      console.error('Session check-in error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to check in';
      setCheckinError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsCheckingParticipant(false);
    }
  }, [foundAttendee, selectedSessionId, checkInSession, fetchSessions]);

  const handleConfirmCheckin = useCallback(async () => {
    if (!foundAttendee) return;

    try {
      switch (checkinType) {
        case 'session':
          await handleSessionCheckin();
          return;
        case 'seminar':
          await handleSeminarCheckin();
          return;
        default:
          return;
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Check-in failed';
      toast.error(errorMessage);
      setCheckinError(errorMessage);
    }
  }, [foundAttendee, checkinType, handleSessionCheckin, handleSeminarCheckin]);

  const getCheckinColor = () => {
    switch (checkinType) {
      case 'session': return 'bg-blue-500';
      case 'seminar': return 'bg-purple-500';
      default: return 'bg-[#0C0D0D]';
    }
  };

  const getCheckinLabel = () => {
    switch (checkinType) {
      case 'session': return 'Session Attendance';
      case 'seminar': return 'Seminar Attendance';
      default: return 'Check-in';
    }
  };

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

  const sessionOptions: SessionOption[] = sessions.map((s: Session) => ({
    value: s._id,
    label: `${s.name} (Day ${s.day})`,
    day: s.day,
    type: s.type,
    attendees: s.attendees?.length || 0,
    isActive: s.is_active,
  }));

  const seminarOptions = filteredSeminars.map((s: Seminar) => {
    const participants = s.participants || [];
    const registered = participants.length;
    const capacity = s.capacity || 0;
    const attended = participants.filter((p: Participant) => p.attended).length;
    const isFull = registered >= capacity;
    const status = isFull ? '🔴 Full' : `🟢 ${registered}/${capacity}`;
    
    return {
      value: s._id,
      label: `${s.name} - ${status}`,
      isFull,
      registered,
      attended,
      capacity,
    };
  });

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
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

      {/* CHECK-IN MODAL */}
      {checkinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C0D0D]/70 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-white">
            <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-[#0C0D0D]/5 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-2xl ${getCheckinColor()} text-white`}>
                  {checkinType === 'session' && <Clock className="h-5 w-5" />}
                  {checkinType === 'seminar' && <BookOpen className="h-5 w-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-[#0C0D0D]">{getCheckinLabel()}</h3>
                  <p className="text-xs text-[#0C0D0D]/50 font-medium">
                    {checkinStep === 'select' && 'Select a session or seminar'}
                    {checkinStep === 'verify' && 'Enter verification code'}
                    {checkinStep === 'input' && quickCheckinMode ? 'Quick check-in mode' : 'Enter NLS ID'}
                    {checkinStep === 'confirm' && 'Verify participant information'}
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
              {/* Step 1: Select Seminar or Session */}
              {checkinStep === 'select' && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#ECF4EE] rounded-full flex items-center justify-center mx-auto mb-3">
                      {checkinType === 'seminar' ? (
                        <BookOpen className="h-8 w-8 text-[#0C0D0D]" />
                      ) : (
                        <Clock className="h-8 w-8 text-[#0C0D0D]" />
                      )}
                    </div>
                    <p className="text-sm text-[#0C0D0D]/60 font-medium">
                      {checkinType === 'seminar' 
                        ? 'Select the seminar you want to check in participants for'
                        : 'Select the session you want to mark attendance for'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                      {checkinType === 'seminar' ? 'Select Seminar' : 'Select Session'} <span className="text-rose-500">*</span>
                    </label>
                    
                    {checkinType === 'session' ? (
                      isLoadingSessions || sessionsLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 text-[#0C0D0D] animate-spin" />
                        </div>
                      ) : sessionOptions.length === 0 ? (
                        <div className="text-center py-4 text-sm text-[#0C0D0D]/50">
                          {sessions.length === 0 ? 'No sessions available' : 'Error loading sessions'}
                        </div>
                      ) : (
                        <select
                          value={selectedSessionId}
                          onChange={(e) => setSelectedSessionId(e.target.value)}
                          className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all appearance-none"
                        >
                          <option value="">Select a session...</option>
                          {sessionOptions.map((opt: SessionOption) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label} ({opt.attendees} attended)
                            </option>
                          ))}
                        </select>
                      )
                    ) : (
                      <div className="space-y-3">
                        {availableDays.length > 0 && (
                          <div className="flex gap-2">
                            {availableDays.map((day) => (
                              <button
                                key={day}
                                onClick={() => {
                                  setSelectedDay(day);
                                  setSelectedSeminarId('');
                                }}
                                className={`flex-1 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                                  selectedDay === day
                                    ? 'bg-[#0C0D0D] text-white'
                                    : 'bg-[#FAFAFA] text-[#0C0D0D]/60 hover:bg-[#ECF4EE] border border-[#0C0D0D]/10'
                                }`}
                              >
                                <Calendar className="h-3 w-3 inline mr-1" />
                                Day {day}
                              </button>
                            ))}
                          </div>
                        )}

                        {isLoadingSeminars || seminarsLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-5 w-5 text-[#0C0D0D] animate-spin" />
                          </div>
                        ) : seminarOptions.length === 0 ? (
                          <div className="text-center py-4 text-sm text-[#0C0D0D]/50">
                            {seminarsError 
                              ? 'Error loading seminars' 
                              : `No seminars available for Day ${selectedDay}`}
                          </div>
                        ) : (
                          <select
                            value={selectedSeminarId}
                            onChange={(e) => setSelectedSeminarId(e.target.value)}
                            className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all appearance-none"
                          >
                            <option value="">Select a seminar for Day {selectedDay}...</option>
                            {seminarOptions.map((opt: any) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                    
                    {checkinType === 'seminar' && selectedSeminarDetails && (
                      <div className="mt-3 p-3 bg-[#FAFAFA] rounded-xl border border-[#0C0D0D]/5">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#0C0D0D]/60">Day</span>
                          <span className="font-bold text-[#0C0D0D]">Day {selectedSeminarDetails.day}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-[#0C0D0D]/60">Registered</span>
                          <span className="font-bold text-[#0C0D0D]">
                            {selectedSeminarDetails.participants?.length || 0} / {selectedSeminarDetails.capacity || 0}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-[#0C0D0D]/60">Attended</span>
                          <span className="font-bold text-[#0C0D0D]">
                            {selectedSeminarDetails.participants?.filter((p: Participant) => p.attended).length || 0}
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

                    {checkinType === 'session' && selectedSessionDetails && (
                      <div className="mt-3 p-3 bg-[#FAFAFA] rounded-xl border border-[#0C0D0D]/5">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#0C0D0D]/60">Session</span>
                          <span className="font-bold text-[#0C0D0D]">{selectedSessionDetails.name}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-[#0C0D0D]/60">Day</span>
                          <span className="font-bold text-[#0C0D0D]">Day {selectedSessionDetails.day}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-[#0C0D0D]/60">Time</span>
                          <span className="font-bold text-[#0C0D0D]">
                            {selectedSessionDetails.start_time} - {selectedSessionDetails.end_time}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-[#0C0D0D]/60">Attendees</span>
                          <span className="font-bold text-[#0C0D0D]">
                            {selectedSessionDetails.attendees?.length || 0}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={handleSelectNext}
                    disabled={
                      (checkinType === 'seminar' && !selectedSeminarId) ||
                      (checkinType === 'session' && !selectedSessionId)
                    }
                    className="w-full bg-[#0C0D0D] hover:bg-[#0C0D0D]/90 text-white rounded-2xl py-3 font-extrabold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {checkinType === 'session' ? 'Verify & Continue' : 'Start Quick Check-in'}
                  </Button>

                  {checkinType === 'session' && (
                    <div className="text-center">
                      <p className="text-xs text-[#0C0D0D]/40 flex items-center justify-center gap-1">
                        <Shield className="h-3 w-3" />
                        Session verification required before check-in
                      </p>
                    </div>
                  )}

                  {checkinType === 'seminar' && (
                    <div className="text-center">
                      <p className="text-xs text-[#0C0D0D]/40">
                        Quick check-in mode will automatically advance to the next participant
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 1.5: Verification Code (Session only) */}
              {checkinStep === 'verify' && (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Shield className="h-8 w-8 text-blue-600" />
                    </div>
                    <h4 className="text-lg font-extrabold text-[#0C0D0D]">Session Verification</h4>
                    <p className="text-sm text-[#0C0D0D]/60 mt-1">
                      Enter the 4-digit verification code for this session
                    </p>
                  </div>

                  {selectedSessionDetails && (
                    <div className="bg-[#FAFAFA] rounded-xl p-3 border border-[#0C0D0D]/5">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#0C0D0D]/60">Session</span>
                        <span className="font-bold text-[#0C0D0D]">{selectedSessionDetails.name}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-[#0C0D0D]/60">Day</span>
                        <span className="font-bold text-[#0C0D0D]">Day {selectedSessionDetails.day}</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-[#0C0D0D]/60">Time</span>
                        <span className="font-bold text-[#0C0D0D]">
                          {selectedSessionDetails.start_time} - {selectedSessionDetails.end_time}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                      Verification Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      ref={codeInputRef}
                      type="password"
                      maxLength={4}
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 4) {
                          setVerificationCode(value);
                        }
                      }}
                      placeholder="Enter 4-digit code"
                      className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-[#0C0D0D]/40 font-mono text-center text-2xl tracking-widest"
                      autoFocus
                    />
                    <div className="flex justify-center gap-2 mt-2">
                      {[0, 1, 2, 3].map((index) => (
                        <div
                          key={index}
                          className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                            verificationCode[index]
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-[#0C0D0D]/10 bg-[#FAFAFA]'
                          }`}
                        >
                          {verificationCode[index] || '•'}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-[#0C0D0D]/40 mt-2 text-center">
                      {verificationAttempts > 0 && (
                        <span className="text-rose-600">
                          {3 - verificationAttempts} attempts remaining
                        </span>
                      )}
                    </p>
                  </div>

                  {checkinError && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-rose-600 font-medium">{checkinError}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setCheckinStep('select');
                        setVerificationCode('');
                        setCheckinError(null);
                      }}
                      className="flex-1 rounded-2xl border-[#0C0D0D]/10 bg-[#FAFAFA] text-[#0C0D0D] font-bold"
                    >
                      ← Change Session
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isVerifying || verificationCode.length !== 4}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-3 font-extrabold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Key className="h-4 w-4 mr-2" />
                          Verify
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="border-t border-[#0C0D0D]/5 pt-3 text-center">
                    <p className="text-xs text-[#0C0D0D]/30">
                      Contact the session facilitator for the verification code
                    </p>
                  </div>
                </form>
              )}

              {/* Step 2: Input NLS ID - Quick Check-in Mode */}
              {checkinStep === 'input' && (
                <form onSubmit={handleNlsIdSubmit} className="space-y-4">
                  {checkinType === 'seminar' && selectedSeminarDetails && (
                    <div className="bg-[#ECF4EE] rounded-xl p-3 text-center">
                      <p className="text-xs text-[#0C0D0D]/60">Checking in to</p>
                      <p className="text-sm font-bold text-[#0C0D0D]">{selectedSeminarDetails.name}</p>
                      <div className="flex justify-center gap-4 mt-1">
                        <span className="text-xs text-[#0C0D0D]/50">Day {selectedSeminarDetails.day}</span>
                        <span className="text-xs text-[#0C0D0D]/50">
                          {selectedSeminarDetails.participants?.filter((p: Participant) => p.attended).length || 0} checked in
                        </span>
                      </div>
                    </div>
                  )}

                  {checkinType === 'session' && selectedSessionDetails && (
                    <div className="bg-[#ECF4EE] rounded-xl p-3 text-center">
                      <p className="text-xs text-[#0C0D0D]/60">Marking attendance for</p>
                      <p className="text-sm font-bold text-[#0C0D0D]">{selectedSessionDetails.name}</p>
                      <div className="flex justify-center gap-4 mt-1">
                        <span className="text-xs text-[#0C0D0D]/50">Day {selectedSessionDetails.day}</span>
                        <span className="text-xs text-[#0C0D0D]/50">
                          {selectedSessionDetails.attendees?.length || 0} attended
                        </span>
                      </div>
                      {isVerified && (
                        <div className="mt-1">
                          <Badge variant="success" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                            ✅ Verified
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="info" className="bg-[#0C0D0D] text-white border-0 px-3 py-1">
                      <Repeat className="h-3 w-3 mr-1" />
                      Quick Check-in Mode
                    </Badge>
                    {checkinType === 'session' && (
                      <Badge variant="info" className="bg-blue-100 text-blue-700 border-blue-200">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#ECF4EE] rounded-full flex items-center justify-center mx-auto mb-3">
                      <Fingerprint className="h-8 w-8 text-[#0C0D0D]" />
                    </div>
                    <p className="text-sm text-[#0C0D0D]/60 font-medium">
                      Enter NLS ID to check in
                    </p>
                    {recentlyCheckedIn.length > 0 && (
                      <div className="mt-2 text-xs text-[#0C0D0D]/40">
                        Last checked in: <span className="font-bold text-[#0C0D0D]">{recentlyCheckedIn[0].name}</span>
                      </div>
                    )}
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

                  {checkinError && (
                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-rose-600 font-medium">{checkinError}</p>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        if (checkinType === 'session') {
                          setCheckinStep('verify');
                          setVerificationCode('');
                          setIsVerified(false);
                        } else {
                          setCheckinStep('select');
                        }
                        setNlsIdInput('');
                        setCheckinError(null);
                        setQuickCheckinMode(false);
                      }}
                      className="flex-1 rounded-2xl border-[#0C0D0D]/10 bg-[#FAFAFA] text-[#0C0D0D] font-bold"
                    >
                      ← {checkinType === 'session' ? 'Verify Again' : 'Change'}
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSearching}
                      className="flex-1 bg-[#0C0D0D] hover:bg-[#0C0D0D]/90 text-white rounded-2xl py-3 font-extrabold"
                    >
                      {isSearching ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Find & Check-in
                        </>
                      )}
                    </Button>
                  </div>

                  {recentlyCheckedIn.length > 1 && (
                    <div className="border-t border-[#0C0D0D]/5 pt-3">
                      <p className="text-xs text-[#0C0D0D]/40 mb-2">Recent Check-ins</p>
                      <div className="space-y-1">
                        {recentlyCheckedIn.slice(1).map((item, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span className="text-[#0C0D0D]">{item.name}</span>
                            <span className="text-[#0C0D0D]/40">{item.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

                  {checkinType === 'session' && selectedSessionDetails && (
                    <div className="text-center space-y-2">
                      <div className="text-xs text-[#0C0D0D]/60">
                        <span className="font-bold">Session:</span> {selectedSessionDetails.name} (Day {selectedSessionDetails.day})
                      </div>
                      <div className="text-xs text-[#0C0D0D]/60">
                        <span className="font-bold">Time:</span> {selectedSessionDetails.start_time} - {selectedSessionDetails.end_time}
                      </div>
                      <div className="flex justify-center">
                        <Badge variant="success" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          ✅ Verified Session
                        </Badge>
                      </div>
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
                    
                    <Button
                      variant="primary"
                      onClick={handleResetForNext}
                      className={`flex-1 text-white rounded-2xl py-3 font-extrabold ${
                        checkinType === 'seminar' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <Repeat className="h-4 w-4 mr-2" />
                      Check Next
                    </Button>
                  </div>

                  {lastCheckedInName && (
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