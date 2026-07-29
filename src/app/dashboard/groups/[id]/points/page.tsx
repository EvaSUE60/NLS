// src/app/dashboard/groups/[id]/points/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Zap,
  Plus,
  Minus,
  Loader2,
  Star,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { useGroup } from '@/src/hooks/useGroup';
import { toast } from 'sonner';

interface GroupPointsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function GroupPointsPage({ params }: GroupPointsPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const {
    selectedGroup: group,
    activities,
    isLoading,
    error,
    fetchGroup,
    fetchActivities,
    updatePoints,
    clearError,
    clearSelected,
  } = useGroup(false);

  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsData, setPointsData] = useState({
    type: 'bonus' as 'bonus' | 'penalty',
    points: 1,
    reason: '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchGroup(id);
    fetchActivities(id);
    return () => clearSelected();
  }, [id]);

  const handleUpdatePoints = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pointsData.reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    if (pointsData.points < 1) {
      toast.error('Points must be at least 1');
      return;
    }

    setIsUpdating(true);
    try {
      await updatePoints(id, pointsData);
      toast.success(`Points updated successfully`);
      setShowPointsModal(false);
      setPointsData({ type: 'bonus', points: 1, reason: '' });
      await fetchGroup(id);
      await fetchActivities(id);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update points');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading && !group) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-[#0C0D0D] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
        <p className="text-rose-700 font-medium">Error: {error}</p>
        <Button
          onClick={() => { clearError(); fetchGroup(id); }}
          className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-[#0C0D0D]/20 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-[#0C0D0D]">Group not found</h3>
        <Link href="/dashboard/groups">
          <Button className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold">
            Back to Groups
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/groups/${id}`}
          className="p-2 rounded-xl hover:bg-[#ECF4EE] transition-colors text-[#0C0D0D]/60 hover:text-[#0C0D0D]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#0C0D0D]">Manage Points</h1>
          <p className="text-xs text-[#0C0D0D]/60 font-medium">
            {group.name} • Current points: {group.points}
          </p>
        </div>
      </div>

      {/* Points Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs text-center">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Current Points</p>
          <p className="mt-2 text-4xl font-black text-purple-600">{group.points}</p>
        </div>
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs text-center">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Total Earned</p>
          <p className="mt-2 text-4xl font-black text-emerald-600">+{group.total_earned || 0}</p>
        </div>
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs text-center">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Total Lost</p>
          <p className="mt-2 text-4xl font-black text-rose-600">-{group.total_lost || 0}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowPointsModal(true)}
          className="flex-1 flex items-center justify-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 px-6 py-3 rounded-2xl text-sm font-bold transition-all"
        >
          <Zap className="h-5 w-5" />
          Add Points
        </button>
        <button
          onClick={() => router.push(`/dashboard/groups/${id}`)}
          className="flex-1 flex items-center justify-center gap-2 border border-[#ECF4EE] hover:border-[#0C0D0D]/20 px-6 py-3 rounded-2xl text-sm font-bold text-[#0C0D0D] transition-all"
        >
          Back to Group
        </button>
      </div>

      {/* Activity History */}
      <Card className="p-6 border border-[#ECF4EE]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-[#0C0D0D]">Activity History</h3>
            <p className="text-xs text-[#0C0D0D]/60 font-medium">
              {activities.length} activities recorded
            </p>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-10 w-10 text-[#0C0D0D]/20 mx-auto mb-3" />
            <p className="text-sm font-medium text-[#0C0D0D]/60">No activities recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity.activity_id}
                className={`flex items-center gap-4 p-4 rounded-2xl border ${
                  activity.type === 'bonus'
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div className={`p-2 rounded-xl ${
                  activity.type === 'bonus'
                    ? 'bg-emerald-200 text-emerald-700'
                    : 'bg-rose-200 text-rose-700'
                }`}>
                  {activity.type === 'bonus' ? (
                    <Star className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#0C0D0D]">{activity.description}</p>
                  <p className="text-xs text-[#0C0D0D]/60">
                    {activity.reason || 'No reason provided'} • {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
                <div className={`text-sm font-extrabold ${
                  activity.points > 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {activity.points > 0 ? '+' : ''}{activity.points}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Points Modal */}
      {showPointsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C0D0D]/70 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-purple-600 text-white">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#0C0D0D]">Update Points</h3>
                  <p className="text-xs text-[#0C0D0D]/50 font-medium">
                    {group.name} • Current: {group.points}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPointsModal(false)}
                className="p-1.5 rounded-full hover:bg-[#ECF4EE] transition-colors"
              >
                <X className="h-5 w-5 text-[#0C0D0D]/60" />
              </button>
            </div>

            <form onSubmit={handleUpdatePoints} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                  Type
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPointsData({ ...pointsData, type: 'bonus' })}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      pointsData.type === 'bonus'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#FAFAFA] text-[#0C0D0D]/60 hover:bg-[#ECF4EE]'
                    }`}
                  >
                    <Star className="h-4 w-4 mx-auto mb-1" />
                    Bonus
                  </button>
                  <button
                    type="button"
                    onClick={() => setPointsData({ ...pointsData, type: 'penalty' })}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      pointsData.type === 'penalty'
                        ? 'bg-rose-600 text-white'
                        : 'bg-[#FAFAFA] text-[#0C0D0D]/60 hover:bg-[#ECF4EE]'
                    }`}
                  >
                    <AlertCircle className="h-4 w-4 mx-auto mb-1" />
                    Penalty
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                  Points
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPointsData({ ...pointsData, points: Math.max(1, pointsData.points - 1) })}
                    className="p-2 rounded-xl bg-[#FAFAFA] border border-[#ECF4EE] hover:bg-[#ECF4EE] transition-colors"
                  >
                    <Minus className="h-4 w-4 text-[#0C0D0D]" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={pointsData.points}
                    onChange={(e) => setPointsData({ ...pointsData, points: parseInt(e.target.value) || 1 })}
                    className="w-20 px-4 py-2.5 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-center text-lg font-bold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setPointsData({ ...pointsData, points: Math.min(50, pointsData.points + 1) })}
                    className="p-2 rounded-xl bg-[#FAFAFA] border border-[#ECF4EE] hover:bg-[#ECF4EE] transition-colors"
                  >
                    <Plus className="h-4 w-4 text-[#0C0D0D]" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                  Reason <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={pointsData.reason}
                  onChange={(e) => setPointsData({ ...pointsData, reason: e.target.value })}
                  placeholder="e.g., Excellent participation"
                  className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isUpdating}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-3 font-bold"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Update Points
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPointsModal(false)}
                  className="flex-1 rounded-2xl border-[#0C0D0D]/10 bg-[#FAFAFA] text-[#0C0D0D] font-bold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}