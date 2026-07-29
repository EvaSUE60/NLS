// src/app/dashboard/groups/bulk/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
  Plus,
  Trash2,
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { useGroup } from '@/src/hooks/useGroup';
import { toast } from 'sonner';

export default function BulkCreateGroupsPage() {
  const router = useRouter();
  const { bulkCreate, isLoading, error, clearError } = useGroup();

  const [groupCount, setGroupCount] = useState(52);
  const [maxSize, setMaxSize] = useState(12);
  const [namePrefix, setNamePrefix] = useState('NLS Group');
  const [description, setDescription] = useState('NLS 2026 Small Groups');
  const [startFrom, setStartFrom] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (groupCount < 1) {
      toast.error('Please enter at least 1 group');
      return;
    }

    if (groupCount > 100) {
      toast.error('Maximum 100 groups per request');
      return;
    }

    if (maxSize < 1 || maxSize > 20) {
      toast.error('Max size must be between 1 and 20');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await bulkCreate({
        count: groupCount,
        max_size: maxSize,
        name_prefix: namePrefix,
        description: description || undefined,
        start_from: startFrom,
      });

      setResult(response);
      toast.success(`Created ${response.created?.length || 0} groups`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create groups');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setGroupCount(52);
    setMaxSize(12);
    setNamePrefix('NLS Group');
    setDescription('NLS 2026 Small Groups');
    setStartFrom(1);
  };

  if (result) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-3xl p-8 border border-[#ECF4EE] shadow-sm">
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black text-[#0C0D0D]">Groups Created!</h2>
            <p className="text-sm text-[#0C0D0D]/60 mt-1">
              Successfully created {result.created?.length || 0} groups
            </p>
            {result.skipped?.length > 0 && (
              <p className="text-sm text-amber-600 mt-1">
                Skipped {result.skipped.length} groups (already exist)
              </p>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {result.created?.map((group: any) => (
              <div
                key={group._id}
                className="p-4 rounded-2xl bg-[#ECF4EE]/50 border border-[#ECF4EE]"
              >
                <p className="font-bold text-[#0C0D0D] text-sm">{group.name}</p>
                <p className="text-xs text-[#0C0D0D]/50 font-mono">{group.group_code}</p>
                <Badge variant="info" className="text-[10px] mt-1">
                  Max: {group.max_size}
                </Badge>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleReset}
              className="flex-1 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl py-3 font-bold"
            >
              Create More Groups
            </Button>
            <Button
              onClick={() => router.push('/dashboard/groups')}
              variant="secondary"
              className="flex-1 rounded-2xl border-[#0C0D0D]/10 bg-[#FAFAFA] text-[#0C0D0D] font-bold"
            >
              View All Groups
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/groups"
          className="p-2 rounded-xl hover:bg-[#ECF4EE] transition-colors text-[#0C0D0D]/60 hover:text-[#0C0D0D]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#0C0D0D]">Bulk Create Groups</h1>
          <p className="text-xs text-[#0C0D0D]/60 font-medium">
            Create multiple groups at once for your event
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <button
            onClick={clearError}
            className="p-1 rounded-lg hover:bg-rose-100 transition-colors"
          >
            <X className="h-4 w-4 text-rose-700" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 border border-[#ECF4EE]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0C0D0D]">Group Configuration</h3>
              <p className="text-xs text-[#0C0D0D]/60 font-medium">
                Configure how many groups to create
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Number of Groups */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Number of Groups <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={groupCount}
                  onChange={(e) => setGroupCount(parseInt(e.target.value) || 1)}
                  className="w-32 px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all"
                />
                <span className="text-sm text-[#0C0D0D]/60 font-medium">groups</span>
              </div>
              <p className="mt-1 text-xs text-[#0C0D0D]/40">
                For 600 students with 12 per group, you need 50 groups
              </p>
            </div>

            {/* Max Size */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Max Size Per Group <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={maxSize}
                  onChange={(e) => setMaxSize(parseInt(e.target.value) || 12)}
                  className="w-32 px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all"
                />
                <span className="text-sm text-[#0C0D0D]/60 font-medium">members</span>
              </div>
              <p className="mt-1 text-xs text-[#0C0D0D]/40">
                Recommended: 12 members per group
              </p>
            </div>

            {/* Name Prefix */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Name Prefix
              </label>
              <input
                type="text"
                value={namePrefix}
                onChange={(e) => setNamePrefix(e.target.value)}
                placeholder="e.g., Group, Team, Squad"
                className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all placeholder:text-[#0C0D0D]/40"
              />
              <p className="mt-1 text-xs text-[#0C0D0D]/40">
                Groups will be named: {namePrefix} 1, {namePrefix} 2, etc.
              </p>
            </div>

            {/* Start From */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Start From
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  value={startFrom}
                  onChange={(e) => setStartFrom(parseInt(e.target.value) || 1)}
                  className="w-32 px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all"
                />
                <span className="text-sm text-[#0C0D0D]/60 font-medium">starting number</span>
              </div>
              <p className="mt-1 text-xs text-[#0C0D0D]/40">
                Groups will be numbered from this number
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., NLS 2026 Groups"
                className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all placeholder:text-[#0C0D0D]/40"
              />
            </div>
          </div>
        </Card>

        {/* Preview */}
        <Card className="p-6 border border-[#ECF4EE] bg-[#ECF4EE]/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-[#0C0D0D]">Summary</h4>
                <p className="text-xs text-[#0C0D0D]/60 font-medium">
                  Will create {groupCount} groups with {maxSize} members each
                </p>
              </div>
            </div>
            <Badge variant="info" className="text-xs font-bold px-3 py-1 rounded-xl bg-[#0C0D0D] text-[#ECF4EE]">
              Total Capacity: {groupCount * maxSize}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: Math.min(groupCount, 10) }, (_, i) => i + 1).map((num) => (
              <Badge key={num} variant="info" className="text-xs bg-white text-[#0C0D0D] border-[#ECF4EE]">
                {namePrefix} {startFrom + num - 1}
              </Badge>
            ))}
            {groupCount > 10 && (
              <Badge variant="info" className="text-xs bg-white text-[#0C0D0D] border-[#ECF4EE]">
                +{groupCount - 10} more
              </Badge>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || isLoading}
            className="flex-1 bg-[#0C0D0D] hover:bg-[#0C0D0D]/90 text-white rounded-2xl py-3 font-bold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Groups...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Create {groupCount} Groups
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/dashboard/groups')}
            className="flex-1 rounded-2xl border-[#0C0D0D]/10 bg-[#FAFAFA] text-[#0C0D0D] font-bold"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}