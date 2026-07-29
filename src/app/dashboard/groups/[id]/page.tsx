// src/app/dashboard/groups/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  UserPlus,
  UserMinus,
  Clock,
  Loader2,
  Minus,
  Trash2,
  Plus,
  X,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { useGroup } from '@/src/hooks/useGroup';
import { toast } from 'sonner';

interface GroupDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function GroupDetailsPage({ params }: GroupDetailsPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const {
    selectedGroup: group,
    activities,
    isLoading,
    error,
    fetchGroup,
    fetchActivities,
    delete: deleteGroup,
    assign: assignAttendee,
    remove: removeAttendee,
    updatePoints,
    clearError,
    clearSelected,
  } = useGroup(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [nlsIdInput, setNlsIdInput] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsData, setPointsData] = useState({
    type: 'bonus' as 'bonus' | 'penalty',
    points: 1,
    reason: '',
  });
  const [isUpdatingPoints, setIsUpdatingPoints] = useState(false);

  useEffect(() => {
    fetchGroup(id);
    fetchActivities(id);
    return () => clearSelected();
  }, [id, fetchGroup, fetchActivities, clearSelected]);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${group?.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteGroup(id);
      toast.success(`Group "${group?.name}" deleted successfully`);
      router.push('/dashboard/groups');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete group';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nlsIdInput.trim()) {
      toast.error('Please enter an NLS ID');
      return;
    }

    setIsAssigning(true);
    try {
      await assignAttendee(id, nlsIdInput.trim());
      toast.success('Attendee assigned to group successfully');
      setShowAssignModal(false);
      setNlsIdInput('');
      await fetchGroup(id);
      await fetchActivities(id);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign attendee';
      toast.error(errorMessage);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemove = async (attendeeId: string, fullName: string) => {
    if (!confirm(`Remove ${fullName} from ${group?.name}?`)) {
      return;
    }

    setIsRemoving(attendeeId);
    try {
      await removeAttendee(id, attendeeId);
      toast.success(`${fullName} removed from group`);
      await fetchGroup(id);
      await fetchActivities(id);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove attendee';
      toast.error(errorMessage);
    } finally {
      setIsRemoving(null);
    }
  };

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

    setIsUpdatingPoints(true);
    try {
      await updatePoints(id, pointsData);
      toast.success('Points updated successfully');
      setShowPointsModal(false);
      setPointsData({ type: 'bonus', points: 1, reason: '' });
      await fetchGroup(id);
      await fetchActivities(id);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update points';
      toast.error(errorMessage);
    } finally {
      setIsUpdatingPoints(false);
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
        <Users className="h-12 w-12 text-[#0C0D0D]/20 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-[#0C0D0D]">Group not found</h3>
        <Link href="/dashboard/groups">
          <Button className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold">
            Back to Groups
          </Button>
        </Link>
      </div>
    );
  }

  const memberCount = group.member_count || 0;
  const isFull = memberCount >= group.max_size;
  const availableSlots = group.max_size - memberCount;
  const occupancyRate = group.max_size > 0 ? Math.round((memberCount / group.max_size) * 100) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/groups"
            className="p-2 rounded-xl hover:bg-[#ECF4EE] transition-colors text-[#0C0D0D]/60 hover:text-[#0C0D0D]"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-[#0C0D0D]">{group.name}</h1>
              <Badge variant="info" className="text-xs font-bold px-3 py-1 rounded-xl bg-[#ECF4EE] text-[#0C0D0D] border-[#ECF4EE]">
                {group.group_code}
              </Badge>
              {isFull ? (
                <Badge variant="info" className="text-xs font-bold px-3 py-1 rounded-xl bg-rose-100 text-rose-700 border-rose-200">
                  Full
                </Badge>
              ) : (
                <Badge variant="success" className="text-xs font-bold px-3 py-1 rounded-xl bg-emerald-100 text-emerald-700 border-emerald-200">
                  {availableSlots} slots available
                </Badge>
              )}
            </div>
            {group.description && (
              <p className="text-sm text-[#0C0D0D]/60 mt-1">{group.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAssignModal(true)}
            disabled={isFull}
            className="flex items-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 px-4 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserPlus className="h-4 w-4" />
            Add Member
          </button>
          <button
            onClick={() => setShowPointsModal(true)}
            className="flex items-center gap-2 bg-purple-600 text-white hover:bg-purple-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
          >
            <Zap className="h-4 w-4" />
            Update Points
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-700 transition-all disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Members</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{memberCount}</p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">of {group.max_size} capacity</p>
        </div>
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Points</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-purple-600">{group.points}</p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">Total earned: {group.total_earned} | Lost: {group.total_lost}</p>
        </div>
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Occupancy</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{occupancyRate}%</p>
          <div className="w-full bg-[#ECF4EE] rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                isFull ? 'bg-rose-500' :
                occupancyRate >= 80 ? 'bg-amber-500' :
                'bg-emerald-500'
              }`}
              style={{ width: `${occupancyRate}%` }}
            />
          </div>
        </div>
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Activities</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{activities.length}</p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">Total events recorded</p>
        </div>
      </div>

      {/* Members Section */}
      <Card className="p-6 border border-[#ECF4EE]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0C0D0D]">Members</h3>
              <p className="text-xs text-[#0C0D0D]/60 font-medium">
                {memberCount} members • {availableSlots} slots available
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAssignModal(true)}
            disabled={isFull}
            className="flex items-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </button>
        </div>

        {memberCount === 0 ? (
          <div className="text-center py-8">
            <Users className="h-10 w-10 text-[#0C0D0D]/20 mx-auto mb-3" />
            <p className="text-sm font-medium text-[#0C0D0D]/60">No members assigned yet</p>
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
                  <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-wider">Joined</th>
                  <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECF4EE]">
                {group.members.map((member, index) => (
                  <tr key={member.attendeeId} className="hover:bg-[#ECF4EE]/20 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-[#0C0D0D]/40">{index + 1}</td>
                    <td className="px-4 py-3 text-sm font-bold text-[#0C0D0D]">{member.fullName}</td>
                    <td className="px-4 py-3 text-xs text-[#0C0D0D]/60">{member.unique_id}</td>
                    <td className="px-4 py-3 text-xs text-[#0C0D0D]/60">{member.region}</td>
                    <td className="px-4 py-3 text-xs text-[#0C0D0D]/60">
                      {new Date(member.joinedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemove(member.attendeeId, member.fullName)}
                        disabled={isRemoving === member.attendeeId}
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-[#0C0D0D]/60 hover:text-rose-600 transition-colors disabled:opacity-50"
                      >
                        {isRemoving === member.attendeeId ? (
                          <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                        ) : (
                          <UserMinus className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Activities Section */}
      <Card className="p-6 border border-[#ECF4EE]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-[#0C0D0D]">Activities</h3>
            <p className="text-xs text-[#0C0D0D]/60 font-medium">Points history and activities</p>
          </div>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-10 w-10 text-[#0C0D0D]/20 mx-auto mb-3" />
            <p className="text-sm font-medium text-[#0C0D0D]/60">No activities recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity.activity_id}
                className={`flex items-center justify-between p-4 rounded-2xl border ${
                  activity.type === 'bonus'
                    ? 'bg-emerald-50 border-emerald-200'
                    : activity.type === 'auto_penalty'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-rose-50 border-rose-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${
                    activity.type === 'bonus'
                      ? 'bg-emerald-200 text-emerald-700'
                      : activity.type === 'auto_penalty'
                      ? 'bg-amber-200 text-amber-700'
                      : 'bg-rose-200 text-rose-700'
                  }`}>
                    {activity.type === 'bonus' ? (
                      <Zap className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0C0D0D]">{activity.description}</p>
                    <p className="text-xs text-[#0C0D0D]/60">
                      {activity.reason || 'No reason provided'} • {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
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

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C0D0D]/70 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-[#0C0D0D] text-[#ECF4EE]">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-[#0C0D0D]">Add Member</h3>
                  <p className="text-xs text-[#0C0D0D]/50 font-medium">
                    Enter NLS ID to add to {group.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1.5 rounded-full hover:bg-[#ECF4EE] transition-colors"
              >
                <X className="h-5 w-5 text-[#0C0D0D]/60" />
              </button>
            </div>

            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                  NLS ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={nlsIdInput}
                  onChange={(e) => setNlsIdInput(e.target.value.toUpperCase())}
                  placeholder="e.g., NLS-2026-001"
                  className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all font-mono"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isAssigning}
                  className="flex-1 bg-[#0C0D0D] hover:bg-[#0C0D0D]/90 text-white rounded-2xl py-3 font-bold"
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Member
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 rounded-2xl border-[#0C0D0D]/10 bg-[#FAFAFA] text-[#0C0D0D] font-bold"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    <Zap className="h-4 w-4 mx-auto mb-1" />
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
                  disabled={isUpdatingPoints}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-3 font-bold"
                >
                  {isUpdatingPoints ? (
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