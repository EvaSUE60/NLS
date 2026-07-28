// src/app/seminars/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  BookOpen,
  CheckCircle2,
  AlertCircle,
  User,
  Loader2,
  ChevronRight,
  Clock,
  Building2,
  ArrowLeft,
  Sparkles,
  MapPin,
  Check
} from 'lucide-react';

interface Seminar {
  _id: string;
  name: string;
  day: number;
  date: string;
  start_time: string;
  end_time: string;
  building?: string;
  room?: string;
  capacity: number;
  participants: any[];
  isClosed: boolean;
  is_active: boolean;
}

interface StudentInfo {
  unique_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  region: string;
  campus: string;
}

export default function PublicSeminarsPage() {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Student ID
  const [nlsId, setNlsId] = useState('');
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);
  
  // Step 2: Seminars
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  
  // Step 3: Confirm
  const [pendingSeminar, setPendingSeminar] = useState<Seminar | null>(null);
  const [confirmNlsId, setConfirmNlsId] = useState('');
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  
  // Step 4: Success
  const [registrationData, setRegistrationData] = useState<any>(null);

  const getCurrentDayFromDate = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const dayMapping: Record<string, number> = {
      '2026-07-28': 1,
      '2026-07-29': 2,
      '2026-07-30': 3,
      '2026-07-31': 4,
    };
    
    return dayMapping[todayStr] || 1;
  };

  const formatNlsId = (input: string): string => {
    const trimmed = input.toUpperCase().trim();

    if (/^\d{3}$/.test(trimmed)) {
      return `NLS-2026-${trimmed}`;
    }

    if (/^\d{1,2}$/.test(trimmed)) {
      return `NLS-2026-${trimmed.padStart(3, '0')}`;
    }

    if (/^NLS-\d{4}-\d{3}$/.test(trimmed)) {
      return trimmed;
    }

    return trimmed;
  };

  const fetchSeminars = async (day?: number) => {
    const targetDay = day || getCurrentDayFromDate();
    setCurrentDay(targetDay);
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/public/seminars?day=${targetDay}`);
      const data = await response.json();

      if (data.success) {
        setSeminars(data.data.seminars || []);
      } else {
        setError(data.message || 'Failed to load seminars');
        toast.error(data.message || 'Failed to load seminars');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load seminars. Please try again.');
      toast.error('Failed to load seminars');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nlsId.trim()) {
      toast.error('Please enter your NLS ID');
      return;
    }

    const searchNlsId = formatNlsId(nlsId);

    if (searchNlsId.length < 12) {
      toast.error('Please enter a valid NLS ID (e.g., 001 or NLS-2026-001)');
      return;
    }

    setLoadingStudent(true);
    setStudentError(null);

    try {
      const response = await fetch(`/api/students/${searchNlsId}/info`);
      const data = await response.json();

      if (data.success) {
        setStudentInfo(data.data.student);
        setCurrentStep(2);
        await fetchSeminars();
        toast.success(`Welcome ${data.data.student.full_name}!`);
      } else {
        setStudentError(data.message || 'Student not found');
        toast.error(data.message || 'Student not found');
      }
    } catch {
      setStudentError('Failed to verify student ID');
      toast.error('Failed to verify student ID');
    } finally {
      setLoadingStudent(false);
    }
  };

  const handleSelectSeminar = (seminar: Seminar) => {
    if (!studentInfo) {
      toast.error('Student information not found');
      return;
    }

    const isFull = (seminar.participants?.length || 0) >= seminar.capacity;
    if (seminar.isClosed || isFull) {
      toast.error('This seminar is not available');
      return;
    }

    setPendingSeminar(seminar);
    setConfirmNlsId('');
    setRegistrationError(null);
    setCurrentStep(3);
  };

  const handleConfirmAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentInfo || !pendingSeminar) {
      toast.error('Registration context not found');
      return;
    }

    const firstId = formatNlsId(studentInfo.unique_id);
    const secondId = formatNlsId(confirmNlsId);

    if (!confirmNlsId.trim()) {
      toast.error('Please confirm your NLS ID');
      return;
    }

    if (firstId !== secondId) {
      toast.error('NLS IDs do not match. Please try again.');
      setCurrentStep(1);
      setStudentInfo(null);
      setNlsId('');
      setPendingSeminar(null);
      setConfirmNlsId('');
      setRegistrationError(null);
      return;
    }

    setRegisteringId(pendingSeminar._id);

    try {
      const response = await fetch('/api/public/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nlsId: firstId,
          confirmNlsId: secondId,
          seminarId: pendingSeminar._id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRegistrationData(data.data);
        setCurrentStep(4);
        toast.success(`Registered for ${pendingSeminar.name}! 🎉`);
      } else {
        setRegistrationError(data.message || 'Registration failed');
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setRegistrationError('Registration failed. Please try again.');
      toast.error('Registration failed. Please try again.');
    } finally {
      setRegisteringId(null);
    }
  };

  const steps = [
    { number: 1, label: 'Verify', icon: User },
    { number: 2, label: 'Select', icon: BookOpen },
    { number: 3, label: 'Confirm', icon: CheckCircle2 },
    { number: 4, label: 'Done', icon: Check },
  ];

  const handleDayChange = (day: number) => {
    setCurrentDay(day);
    fetchSeminars(day);
  };

  return (
    <main className="relative min-h-screen bg-[#ECF4EE] px-3 py-4 sm:px-6 text-[#0C0D0D]">
      {/* Subtle ambient lighting */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[15%] top-0 h-[300px] w-[300px] rounded-full bg-white/60 blur-3xl" />
        <div className="absolute bottom-0 right-[15%] h-[300px] w-[300px] rounded-full bg-emerald-100/40 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md mx-auto space-y-3">
        
        {/* Navigation & Compact Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Home</span>
          </Link>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white border border-[#d2e5d7] text-[#0C0D0D]/80">
            <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> Seminars
          </span>
        </div>

        {/* Compact Step Progress Bar */}
        <div className="rounded-2xl border border-[#d2e5d7]/80 bg-white/80 px-3 py-2.5 backdrop-blur-md">
          <div className="flex items-center justify-between px-1">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center gap-0.5">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-[11px] transition-all ${
                      currentStep >= step.number
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'bg-[#ECF4EE] text-[#0C0D0D]/40 border border-[#d2e5d7]'
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <step.icon className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className={`text-[9px] font-semibold ${
                    currentStep >= step.number ? 'text-[#0C0D0D]' : 'text-[#0C0D0D]/40'
                  }`}>
                    {step.label}
                  </span>
                </div>

                {index < steps.length - 1 && (
                  <div className={`w-6 sm:w-10 h-0.5 mx-1 mb-3 rounded-full transition-all ${
                    currentStep > step.number ? 'bg-emerald-600' : 'bg-[#d2e5d7]'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Verify ID */}
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-2xl border border-[#d2e5d7]/80 bg-white/90 p-4 sm:p-5 text-center backdrop-blur-md">
                <div className="w-10 h-10 bg-emerald-50 border border-emerald-200/60 rounded-xl flex items-center justify-center mx-auto mb-2.5 text-emerald-800">
                  <User className="w-5 h-5" />
                </div>
                
                <h2 className="text-base font-bold text-[#0C0D0D]">Verify Student ID</h2>
                <p className="text-[11px] text-[#0C0D0D]/60 mt-0.5">
                  Enter your NLS ID to access available seminars
                </p>

                <form onSubmit={handleVerifyStudent} className="space-y-3 mt-4">
                  <div>
                    <input
                      type="text"
                      value={nlsId}
                      onChange={(e) => setNlsId(e.target.value.toUpperCase())}
                      placeholder="e.g. 001 or NLS-2026-001"
                      className="w-full px-3 py-2.5 bg-[#ECF4EE]/30 border border-[#d2e5d7] rounded-xl text-[#0C0D0D] placeholder-[#0C0D0D]/30 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white transition-all font-mono text-center text-base font-bold"
                      autoFocus
                    />
                    <p className="text-[10px] text-[#0C0D0D]/50 text-center mt-1">
                      Full code or last 3 digits (e.g. <span className="font-mono font-bold text-[#0C0D0D]">001</span>)
                    </p>
                  </div>

                  {studentError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold rounded-xl p-2.5 text-center flex items-center justify-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{studentError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loadingStudent}
                    className="w-full flex items-center justify-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl py-2.5 px-4 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    {loadingStudent ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Step 2: Select Seminar */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-2.5"
            >
              {/* Compact Student Header Banner */}
              {studentInfo && (
                <div className="rounded-2xl border border-[#d2e5d7]/80 bg-white/90 p-3 flex items-center justify-between backdrop-blur-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-emerald-50 border border-emerald-200/60 rounded-xl flex items-center justify-center text-emerald-800 flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0C0D0D]">{studentInfo.full_name}</p>
                      <p className="text-[10px] text-[#0C0D0D]/50 flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" /> {studentInfo.region || 'Student'}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Check className="w-2.5 h-2.5 text-emerald-700" /> Verified
                  </span>
                </div>
              )}

              {/* Day Selector */}
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {[1, 2, 3, 4].map((day) => (
                  <button
                    key={day}
                    onClick={() => handleDayChange(day)}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-[11px] font-bold transition-all border ${
                      currentDay === day
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white/80 text-[#0C0D0D]/60 border-[#d2e5d7] hover:bg-white hover:text-[#0C0D0D]'
                    }`}
                  >
                    Day {day}
                  </button>
                ))}
              </div>

              {/* Seminars List Card */}
              <div className="rounded-2xl border border-[#d2e5d7]/80 bg-white/90 p-3.5 backdrop-blur-md">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#ECF4EE]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0C0D0D]/50">
                    Day {currentDay} Sessions
                  </span>
                  <BookOpen className="w-3.5 h-3.5 text-[#0C0D0D]/40" />
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-8 text-[#0C0D0D]/50 gap-1.5">
                    <Loader2 className="w-5 h-5 text-emerald-700 animate-spin" />
                    <span className="text-[11px] font-bold">Loading Seminars...</span>
                  </div>
                ) : error ? (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl p-3 text-center space-y-0.5">
                    <AlertCircle className="w-4 h-4 mx-auto text-rose-600" />
                    <p>{error}</p>
                  </div>
                ) : seminars.length === 0 ? (
                  <div className="text-center py-8 space-y-1">
                    <BookOpen className="w-8 h-8 text-[#0C0D0D]/20 mx-auto" />
                    <p className="text-xs font-semibold text-[#0C0D0D]/50">No seminars available for Day {currentDay}</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {seminars.map((seminar) => {
                      const registeredCount = seminar.participants?.length || 0;
                      const isFull = registeredCount >= seminar.capacity;
                      const isAvailable = !seminar.isClosed && !isFull;
                      const isRegistering = registeringId === seminar._id;

                      return (
                        <button
                          key={seminar._id}
                          onClick={() => isAvailable && handleSelectSeminar(seminar)}
                          disabled={!isAvailable || isRegistering}
                          className={`w-full text-left px-3 py-2.5 rounded-xl transition-all border flex items-center justify-between ${
                            isAvailable 
                              ? 'bg-emerald-50/20 border-[#d2e5d7] hover:border-emerald-600 hover:bg-white active:scale-[0.99]' 
                              : 'bg-gray-50 border-transparent opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className={`text-xs font-bold truncate ${
                              isAvailable ? 'text-[#0C0D0D]' : 'text-[#0C0D0D]/50'
                            }`}>
                              {seminar.name}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] font-medium text-[#0C0D0D]/50 mt-0.5">
                              {seminar.start_time && seminar.end_time && (
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-2.5 h-2.5" />
                                  {seminar.start_time} - {seminar.end_time}
                                </span>
                              )}
                              {seminar.building && (
                                <span className="flex items-center gap-0.5 truncate">
                                  <Building2 className="w-2.5 h-2.5" />
                                  {seminar.building}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] font-mono font-bold text-[#0C0D0D]/60 block">
                                {registeredCount}/{seminar.capacity}
                              </span>
                              {!isAvailable && (
                                <span className="text-[8px] font-bold uppercase px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 border border-rose-200 inline-block">
                                  {seminar.isClosed ? 'Closed' : 'Full'}
                                </span>
                              )}
                            </div>
                            {isRegistering ? (
                              <Loader2 className="w-3.5 h-3.5 text-emerald-700 animate-spin" />
                            ) : isAvailable ? (
                              <ChevronRight className="w-3.5 h-3.5 text-[#0C0D0D]/40" />
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Compact Back Action */}
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setStudentInfo(null);
                  setNlsId('');
                }}
                className="w-full border border-[#d2e5d7] bg-white hover:bg-gray-50 text-[#0C0D0D]/70 text-xs font-bold py-2 rounded-xl transition-all"
              >
                Change Student ID
              </button>
            </motion.div>
          )}

          {/* Step 3: Confirm ID */}
          {currentStep === 3 && pendingSeminar && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-2xl border border-[#d2e5d7]/80 bg-white/90 p-4 sm:p-5 text-center backdrop-blur-md">
                <div className="w-10 h-10 bg-emerald-50 border border-emerald-200/60 rounded-xl flex items-center justify-center mx-auto mb-2 text-emerald-800">
                  <BookOpen className="w-5 h-5" />
                </div>

                <h2 className="text-base font-bold text-[#0C0D0D]">Confirm Registration</h2>
                <p className="text-[11px] text-[#0C0D0D]/60 mt-0.5">
                  Re-enter your NLS ID to finalize:
                </p>
                <div className="mt-2 p-2 bg-[#ECF4EE]/50 border border-[#d2e5d7] rounded-xl">
                  <p className="text-xs font-bold text-emerald-900">
                    {pendingSeminar.name}
                  </p>
                </div>

                <form onSubmit={handleConfirmAndRegister} className="space-y-3 mt-4">
                  <div>
                    <input
                      type="text"
                      value={confirmNlsId}
                      onChange={(e) => setConfirmNlsId(e.target.value.toUpperCase())}
                      placeholder="Re-enter NLS ID"
                      className="w-full px-3 py-2.5 bg-[#ECF4EE]/30 border border-[#d2e5d7] rounded-xl text-[#0C0D0D] placeholder-[#0C0D0D]/30 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:bg-white transition-all font-mono text-center text-base font-bold"
                      autoFocus
                    />
                    <p className="text-[10px] text-[#0C0D0D]/50 text-center mt-1">
                      Must match <span className="font-mono font-bold text-[#0C0D0D]">{studentInfo?.unique_id}</span>
                    </p>
                  </div>

                  {registrationError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold rounded-xl p-2 text-center">
                      {registrationError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(2);
                        setPendingSeminar(null);
                        setConfirmNlsId('');
                        setRegistrationError(null);
                      }}
                      className="flex-1 border border-[#d2e5d7] bg-white hover:bg-gray-50 text-[#0C0D0D]/70 text-xs font-bold py-2.5 rounded-xl transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={!!registeringId}
                      className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                    >
                      {registeringId ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Registering...</span>
                        </>
                      ) : (
                        <span>Confirm</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-2xl border border-emerald-300/80 bg-white/90 p-4 sm:p-5 text-center space-y-3 backdrop-blur-md">
                <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center mx-auto text-emerald-700">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                
                <div>
                  <h2 className="text-lg font-bold text-[#0C0D0D]">
                    Registration Successful! 🎉
                  </h2>
                  <p className="text-xs text-[#0C0D0D]/60 mt-0.5">
                    Confirmed for <span className="text-[#0C0D0D] font-bold">{registrationData?.seminar?.name}</span>
                  </p>
                </div>

                <div className="bg-[#ECF4EE]/40 border border-[#d2e5d7] rounded-xl p-3 text-left space-y-1.5 text-xs">
                  <div className="flex justify-between border-b border-[#d2e5d7]/60 pb-1">
                    <span className="text-[#0C0D0D]/50 font-medium">Student</span>
                    <span className="font-bold text-[#0C0D0D]">{studentInfo?.full_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#d2e5d7]/60 pb-1">
                    <span className="text-[#0C0D0D]/50 font-medium">Seminar</span>
                    <span className="font-bold text-emerald-800">{registrationData?.seminar?.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#d2e5d7]/60 pb-1">
                    <span className="text-[#0C0D0D]/50 font-medium">Event Day</span>
                    <span className="font-bold text-[#0C0D0D]">Day {registrationData?.seminar?.day}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#0C0D0D]/50 font-medium">Capacity</span>
                    <span className="font-mono font-bold text-[#0C0D0D]">
                      {registrationData?.seminar?.registeredCount}/{registrationData?.seminar?.capacity}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={() => {
                      setCurrentStep(1);
                      setRegistrationData(null);
                      setPendingSeminar(null);
                      setConfirmNlsId('');
                      fetchSeminars(currentDay);
                    }}
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all"
                  >
                    Back to Seminar
                  </button>
                  
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer info */}
        <div className="text-center pt-1">
          <p className="text-[9px] font-bold tracking-widest text-[#0C0D0D]/30 uppercase">
            NLS 2026 • EvaSUE Ethiopia
          </p>
        </div>
      </div>
    </main>
  );
}