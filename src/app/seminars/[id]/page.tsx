// src/app/seminars/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Building2, 
  Users, 
  Loader2,
  CheckCircle,
  AlertCircle,
  User
} from 'lucide-react';

interface SeminarDetail {
  id: string;
  name: string;
  day: number;
  dayLabel: string;
  date: string;
  start_time: string;
  end_time: string;
  building?: string;
  room?: string;
  capacity: number;
  registeredCount: number;
  isFull: boolean;
  isClosed: boolean;
  category?: string;
  description?: string;
}

export default function PublicSeminarDetailPage() {
  const params = useParams();
  const router = useRouter();
  const seminarId = params.id as string;
  
  const [seminar, setSeminar] = useState<SeminarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nmsId, setNmsId] = useState('');
  const [registering, setRegistering] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);

  useEffect(() => {
    fetchSeminar();
  }, [seminarId]);

  const fetchSeminar = async () => {
    try {
      const response = await fetch(`/api/public/seminars/${seminarId}`);
      const data = await response.json();
      if (data.success) {
        setSeminar(data.data);
      } else {
        setError(data.message || 'Seminar not found');
      }
    } catch {
      setError('Failed to load seminar');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nmsId.trim()) {
      toast.error('Please enter your NLS ID');
      return;
    }

    setRegistering(true);
    try {
      const response = await fetch('/api/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nmsId: nmsId.trim().toUpperCase(),
          seminarId: seminarId,
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Registration successful! 🎉');
        setShowRegistration(false);
        setNmsId('');
        fetchSeminar();
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch {
      toast.error('Registration failed. Please try again.');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error || !seminar) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="p-6 border-white/5 bg-slate-900/60 backdrop-blur-sm text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Seminar Not Found</h2>
          <p className="text-sm text-slate-400 mb-4">{error || 'The seminar you\'re looking for doesn\'t exist.'}</p>
          <Link href="/seminars">
            <Button variant="primary" className="bg-emerald-600 hover:bg-emerald-700">
              View All Seminars
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isAvailable = !seminar.isClosed && !seminar.isFull;
  const occupancyRate = Math.round((seminar.registeredCount / seminar.capacity) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="relative z-10 max-w-md mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/seminars" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to Seminars</span>
        </Link>

        <Card className="p-6 border-white/5 bg-slate-900/60 backdrop-blur-sm">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="info" className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                {seminar.dayLabel}
              </Badge>
              {!isAvailable && (
                <Badge variant="danger" className="text-[10px]">
                  {seminar.isClosed ? 'Closed' : 'Full'}
                </Badge>
              )}
            </div>
            <h1 className="text-xl font-bold text-white">{seminar.name}</h1>
            {seminar.category && (
              <p className="text-xs text-emerald-400 mt-1">{seminar.category}</p>
            )}
          </div>

          {/* Details */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>{seminar.date ? new Date(seminar.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <Clock className="w-4 h-4" />
              <span>{seminar.start_time} - {seminar.end_time}</span>
            </div>
            {(seminar.building || seminar.room) && (
              <div className="flex items-center gap-3 text-slate-400">
                <Building2 className="w-4 h-4" />
                <span>{seminar.building}{seminar.room ? `, ${seminar.room}` : ''}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-slate-400">
              <Users className="w-4 h-4" />
              <span>{seminar.registeredCount} / {seminar.capacity} registered</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Capacity</span>
              <span>{occupancyRate}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all ${
                  occupancyRate >= 90 ? 'bg-red-500' :
                  occupancyRate >= 70 ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>

          {/* Description */}
          {seminar.description && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-slate-400">{seminar.description}</p>
            </div>
          )}

          {/* Register Button */}
          <div className="mt-6">
            {isAvailable ? (
              <button
                onClick={() => setShowRegistration(!showRegistration)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all"
              >
                Register Now
              </button>
            ) : (
              <button
                disabled
                className="w-full py-3 bg-white/5 text-slate-500 font-bold rounded-xl cursor-not-allowed"
              >
                {seminar.isClosed ? 'Seminar Closed' : 'Seminar Full'}
              </button>
            )}
          </div>

          {/* Registration Form */}
          {showRegistration && isAvailable && (
            <form onSubmit={handleRegister} className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-slate-400 mb-3">Enter your NLS ID to register</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={nmsId}
                  onChange={(e) => setNmsId(e.target.value.toUpperCase())}
                  placeholder="e.g., 001 or NLS-2026-001"
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-sm"
                  autoFocus
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={registering}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register'}
                </Button>
              </div>
              <button
                type="button"
                onClick={() => setShowRegistration(false)}
                className="text-xs text-slate-500 hover:text-slate-400 mt-2"
              >
                Cancel
              </button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}