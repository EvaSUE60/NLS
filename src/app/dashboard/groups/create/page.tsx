// src/app/dashboard/groups/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Users,
  Save,
  Loader2,
  X,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useGroup } from '@/src/hooks/useGroup';
import { toast } from 'sonner';

export default function CreateGroupPage() {
  const router = useRouter();
  const { create, isProcessing, error, clearError } = useGroup();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    max_size: 12,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Group name is required';
    }
    if (!formData.max_size || formData.max_size < 1) {
      errors.max_size = 'Max size must be at least 1';
    }
    if (formData.max_size > 20) {
      errors.max_size = 'Max size cannot exceed 20';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix all validation errors');
      return;
    }

    try {
      await create({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        max_size: formData.max_size,
      });
      toast.success(`Group "${formData.name}" created successfully`);
      router.push('/dashboard/groups');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create group');
    }
  };

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
          <h1 className="text-2xl font-black text-[#0C0D0D]">Create Group</h1>
          <p className="text-xs text-[#0C0D0D]/60 font-medium">Create a new group</p>
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
              <h3 className="font-bold text-[#0C0D0D]">Group Details</h3>
              <p className="text-xs text-[#0C0D0D]/60 font-medium">Configure your group</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Group Name */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Group Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Group Alpha"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-4 py-3 bg-[#FAFAFA] border ${
                  formErrors.name ? 'border-rose-300 focus:ring-rose-500' : 'border-[#0C0D0D]/10 focus:ring-[#0C0D0D]'
                } rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 transition-all`}
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.name}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Description
              </label>
              <input
                type="text"
                placeholder="e.g., NLS 2026 Small Group"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all"
              />
            </div>

            {/* Max Size */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Max Size <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.max_size}
                  onChange={(e) => handleChange('max_size', parseInt(e.target.value) || 1)}
                  className={`w-32 px-4 py-3 bg-[#FAFAFA] border ${
                    formErrors.max_size ? 'border-rose-300 focus:ring-rose-500' : 'border-[#0C0D0D]/10 focus:ring-[#0C0D0D]'
                  } rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 transition-all`}
                />
                <span className="text-sm text-[#0C0D0D]/60 font-medium">members</span>
              </div>
              {formErrors.max_size && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.max_size}</p>
              )}
              <p className="mt-1 text-xs text-[#0C0D0D]/40">Recommended: 12 members per group</p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={isProcessing}
            className="flex-1 bg-[#0C0D0D] hover:bg-[#0C0D0D]/90 text-white rounded-2xl py-3 font-bold"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Group
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