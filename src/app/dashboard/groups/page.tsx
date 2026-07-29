// src/app/dashboard/groups/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  Grid,
  List,
  Loader2,
  Users2,
  UserPlus,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { useGroup } from '@/src/hooks/useGroup';
import { toast } from 'sonner';

export default function GroupsPage() {
  const router = useRouter();
  const {
    groups,
    isLoading,
    error,
    stats,
    fetchGroups,
    delete: deleteGroup,
    clearError,
    fetchStats,
  } = useGroup();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchGroups();
    fetchStats();
  }, [fetchGroups, fetchStats]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setIsDeleting(id);
    try {
      await deleteGroup(id);
      toast.success(`Group "${name}" deleted successfully`);
      fetchStats();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete group');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchGroups();
      await fetchStats();
      toast.success('Groups refreshed');
    } catch {
      toast.error('Failed to refresh groups');
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.group_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (group: any) => {
    if (!group.is_active) {
      return <Badge variant="danger" className="text-[10px] font-bold px-2 py-0.5 rounded-lg">Inactive</Badge>;
    }
    const isFull = (group.member_count || 0) >= group.max_size;
    if (isFull) {
      return <Badge variant="info" className="text-[10px] font-bold px-2 py-0.5 rounded-lg">Full</Badge>;
    }
    return <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5 rounded-lg">Active</Badge>;
  };

  // Use stats from the API or calculate from groups
  const totalGroups = stats?.summary?.total_groups || groups.length || 0;
  const totalMembers = stats?.summary?.total_members || groups.reduce((sum, g) => sum + (g.member_count || 0), 0);
  const fullGroups = stats?.summary?.full_groups || groups.filter(g => (g.member_count || 0) >= g.max_size).length;
  const avgSize = stats?.summary?.average_size || (groups.length > 0 ? Math.round(totalMembers / groups.length) : 0);

  if (isLoading && groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-3xl bg-[#FAFAFA]">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#0C0D0D]/5 blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 text-[#0C0D0D] animate-spin relative z-10" />
        </div>
        <p className="mt-4 text-xs font-bold text-[#0C0D0D]/60 tracking-wider uppercase">
          Loading groups...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
        <p className="text-rose-700 font-medium">Error loading groups: {error}</p>
        <Button
          onClick={() => { clearError(); fetchGroups(); }}
          className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-2 sm:p-4">
      {/* ==================== HEADER ==================== */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0C0D0D] p-6 sm:p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-[#ECF4EE]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-12 w-60 h-60 bg-[#ECF4EE]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECF4EE]/15 border border-[#ECF4EE]/20 text-[#ECF4EE] text-xs font-semibold backdrop-blur-md">
              <Users2 className="w-3.5 h-3.5 text-[#ECF4EE]" /> Groups Management
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Groups Dashboard
            </h1>
            <p className="text-[#ECF4EE]/80 text-sm max-w-xl">
              Manage groups, assign members, and track group performance.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/dashboard/groups/bulk">
              <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-600/20 active:scale-95 transition-all text-sm">
                <Zap className="h-4 w-4 stroke-[2.5]" />
                Bulk Create
              </button>
            </Link>
            <Link href="/dashboard/groups/create">
              <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#ECF4EE] hover:bg-[#ECF4EE]/90 text-[#0C0D0D] font-bold shadow-lg shadow-[#ECF4EE]/10 active:scale-95 transition-all text-sm">
                <Plus className="h-4 w-4 stroke-[2.5]" />
                New Group
              </button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white/10 hover:bg-white/20 text-white border-white/10 backdrop-blur-md rounded-2xl h-11 px-4"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>
        </div>
      </div>

      {/* ==================== STATS CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Total Groups</p>
            <Users2 className="h-4 w-4 text-[#0C0D0D]/30" />
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{totalGroups}</p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">Groups created</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Total Members</p>
            <Users className="h-4 w-4 text-[#0C0D0D]/30" />
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{totalMembers}</p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">Active members</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Avg Size</p>
            <Users className="h-4 w-4 text-[#0C0D0D]/30" />
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">
            {avgSize}
          </p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">Per group</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Full Groups</p>
            <AlertCircle className="h-4 w-4 text-[#0C0D0D]/30" />
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-amber-600">{fullGroups}</p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">At capacity</p>
        </div>
      </div>

      {/* ==================== FILTERS & ACTIONS ==================== */}
      <div className="flex flex-col md:flex-row gap-3 flex-wrap items-center">
        <div className="flex-1 min-w-[220px] w-full relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0C0D0D]/40" />
          <input
            type="text"
            placeholder="Search groups by name or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#ECF4EE] focus:border-[#0C0D0D]/30 rounded-2xl text-xs font-medium text-[#0C0D0D] placeholder-[#0C0D0D]/40 focus:outline-none transition-all shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="flex border border-[#ECF4EE] bg-white rounded-2xl p-1 shadow-2xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#0C0D0D] text-[#ECF4EE]'
                  : 'text-[#0C0D0D]/50 hover:text-[#0C0D0D]'
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#0C0D0D] text-[#ECF4EE]'
                  : 'text-[#0C0D0D]/50 hover:text-[#0C0D0D]'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ==================== GROUPS DISPLAY ==================== */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-12 text-center">
          <Users2 className="h-12 w-12 text-[#0C0D0D]/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[#0C0D0D]">No groups found</h3>
          <p className="text-sm text-[#0C0D0D]/60 mt-1">Create groups or auto-assign attendees.</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            <Link href="/dashboard/groups/create">
              <Button className="bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold">
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </Link>
            <Link href="/dashboard/groups/bulk">
              <Button className="bg-purple-600 text-white hover:bg-purple-700 rounded-2xl px-5 py-2.5 text-xs font-bold">
                <Zap className="h-4 w-4 mr-2" />
                Bulk Create
              </Button>
            </Link>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredGroups.map((group) => {
            const memberCount = group.member_count || 0;
            const isFull = memberCount >= group.max_size;
            const availableSlots = group.max_size - memberCount;

            return (
              <div
                key={group._id}
                className="bg-white rounded-3xl border border-[#ECF4EE] shadow-xs hover:border-[#0C0D0D]/20 hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer"
                onClick={() => router.push(`/dashboard/groups/${group._id}`)}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
                        <Users2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-[#0C0D0D] group-hover:text-purple-700 transition-colors">
                          {group.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <Badge variant="info" className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#ECF4EE]/70 text-[#0C0D0D]/80">
                            {group.group_code}
                          </Badge>
                          {getStatusBadge(group)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/groups/${group._id}`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/groups/${group._id}/edit`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1.5 rounded-xl hover:bg-rose-50 text-[#0C0D0D]/60 hover:text-rose-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(group._id, group.name);
                        }}
                        disabled={isDeleting === group._id}
                      >
                        {isDeleting === group._id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-5 grid grid-cols-3 gap-2.5">
                    <div className="bg-[#ECF4EE]/50 border border-[#ECF4EE] rounded-2xl p-3 text-center">
                      <p className="text-base font-black text-[#0C0D0D]">{memberCount}</p>
                      <p className="text-[10px] font-bold text-[#0C0D0D]/50 uppercase tracking-wider">Members</p>
                    </div>
                    <div className="bg-[#ECF4EE]/50 border border-[#ECF4EE] rounded-2xl p-3 text-center">
                      <p className="text-base font-black text-[#0C0D0D]">{availableSlots}</p>
                      <p className="text-[10px] font-bold text-[#0C0D0D]/50 uppercase tracking-wider">Slots</p>
                    </div>
                    <div className="bg-[#ECF4EE]/50 border border-[#ECF4EE] rounded-2xl p-3 text-center">
                      <p className="text-base font-black text-purple-600">{group.points || 40}</p>
                      <p className="text-[10px] font-bold text-[#0C0D0D]/50 uppercase tracking-wider">Points</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-semibold text-[#0C0D0D]/60 mb-1.5">
                      <span>Capacity</span>
                      <span className="font-bold text-[#0C0D0D]">
                        {group.max_size > 0 ? Math.round((memberCount / group.max_size) * 100) : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-[#ECF4EE] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isFull ? 'bg-rose-500' :
                          (memberCount / group.max_size) * 100 >= 80 ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`}
                        style={{
                          width: `${group.max_size > 0 ? Math.round((memberCount / group.max_size) * 100) : 0}%`
                        }}
                      />
                    </div>
                  </div>

                  {/* Regions */}
                  {group.region_distribution && group.region_distribution.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#ECF4EE]">
                      <div className="flex flex-wrap gap-1.5">
                        {group.region_distribution.map((r: any) => (
                          <Badge key={r.region} variant="info" className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-[#ECF4EE] text-[#0C0D0D] border-[#ECF4EE]">
                            {r.region} ({r.count})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-3xl border border-[#ECF4EE] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#ECF4EE] bg-[#ECF4EE]/40 text-[#0C0D0D]/60">
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Group</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Code</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Members</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Capacity</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Points</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-black uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECF4EE]">
                {filteredGroups.map((group) => {
                  const memberCount = group.member_count || 0;
                  return (
                    <tr key={group._id} className="hover:bg-[#ECF4EE]/20 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
                            <Users2 className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-extrabold text-[#0C0D0D] text-sm">{group.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold font-mono text-[#0C0D0D]/70">{group.group_code}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-extrabold text-[#0C0D0D]">{memberCount}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-[#0C0D0D]/70">{memberCount}/{group.max_size}</span>
                          <div className="w-16 bg-[#ECF4EE] rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                memberCount >= group.max_size ? 'bg-rose-500' :
                                (memberCount / group.max_size) * 100 >= 80 ? 'bg-amber-500' :
                                'bg-emerald-500'
                              }`}
                              style={{
                                width: `${group.max_size > 0 ? Math.round((memberCount / group.max_size) * 100) : 0}%`
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-extrabold text-purple-600">{group.points || 40}</span>
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(group)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors"
                            onClick={() => router.push(`/dashboard/groups/${group._id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors"
                            onClick={() => router.push(`/dashboard/groups/${group._id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-xl hover:bg-rose-50 text-[#0C0D0D]/60 hover:text-rose-600 transition-colors"
                            onClick={() => handleDelete(group._id, group.name)}
                            disabled={isDeleting === group._id}
                          >
                            {isDeleting === group._id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}