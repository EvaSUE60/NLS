// src/app/dashboard/seminars/[id]/edit/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Save,
  Loader2,
  Building2,
  FileText,
  AlertCircle,
  X,
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { useSeminar } from '@/src/hooks/useSeminar';
import { useBuilding } from '@/src/hooks/useBuilding';
import { toast } from 'sonner';

const DAYS = [
  { value: 1, label: 'Day 1' },
  { value: 2, label: 'Day 2' },
  { value: 3, label: 'Day 3' },
  { value: 4, label: 'Day 4' },
  { value: 5, label: 'Day 5' },
];

interface EditSeminarPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditSeminarPage({ params }: EditSeminarPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const {
    selectedSeminar: seminar,
    isLoading,
    error,
    fetchSeminar,
    update,
    clearSelected,
    clearError,
  } = useSeminar();
  const { buildings, fetchBuildings } = useBuilding();

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    day: 1,
    date: '',
    start_time: '',
    end_time: '',
    room: '',
    building: '',
    capacity: 30,
    isClosed: false,
    is_active: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSeminar(id);
    fetchBuildings();
    return () => clearSelected();
  }, [id]);

  useEffect(() => {
    if (seminar) {
      setFormData({
        name: seminar.name || '',
        category: seminar.category || '',
        description: seminar.description || '',
        day: seminar.day || 1,
        date: seminar.date || '',
        start_time: seminar.start_time || '',
        end_time: seminar.end_time || '',
        room: seminar.room || '',
        building: seminar.building || '',
        capacity: seminar.capacity || 30,
        isClosed: seminar.isClosed || false,
        is_active: seminar.is_active !== undefined ? seminar.is_active : true,
      });
    }
  }, [seminar]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Seminar name is required';
    }
    if (!formData.day) {
      errors.day = 'Please select a day';
    }
    if (!formData.date) {
      errors.date = 'Please select a date';
    }
    if (!formData.start_time) {
      errors.start_time = 'Start time is required';
    }
    if (!formData.end_time) {
      errors.end_time = 'End time is required';
    }
    if (formData.start_time >= formData.end_time) {
      errors.end_time = 'End time must be after start time';
    }
    if (!formData.capacity || formData.capacity < 1) {
      errors.capacity = 'Capacity must be at least 1';
    }
    if (formData.capacity > 500) {
      errors.capacity = 'Capacity cannot exceed 500';
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

    setIsSubmitting(true);
    try {
      await update(id, formData);
      toast.success(`Seminar "${formData.name}" updated successfully`);
      router.push(`/dashboard/seminars/${id}`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update seminar');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !seminar) {
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
          onClick={() => { clearError(); fetchSeminar(id); }}
          className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!seminar) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-[#0C0D0D]/20 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-[#0C0D0D]">Seminar not found</h3>
        <Link href="/dashboard/seminars">
          <Button className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold">
            Back to Seminars
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/dashboard/seminars/${id}`}
          className="p-2 rounded-xl hover:bg-[#ECF4EE] transition-colors text-[#0C0D0D]/60 hover:text-[#0C0D0D]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#0C0D0D]">Edit Seminar</h1>
          <p className="text-xs text-[#0C0D0D]/60 font-medium">Editing {seminar.name}</p>
        </div>
        <Badge variant="info" className="ml-auto text-xs font-bold px-3 py-1 rounded-xl">
          {seminar.seminar_key}
        </Badge>
      </div>

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm text-rose-700 font-medium">{error}</p>
          <button
            onClick={() => clearError()}
            className="p-1 rounded-lg hover:bg-rose-100 transition-colors"
          >
            <X className="h-4 w-4 text-rose-700" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <Card className="p-6 border border-[#ECF4EE]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0C0D0D]">Basic Information</h3>
              <p className="text-xs text-[#0C0D0D]/60 font-medium">Seminar details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  formErrors.name
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-[#ECF4EE] focus:border-[#0C0D0D]/30'
                } focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D]`}
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.name}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#ECF4EE] focus:border-[#0C0D0D]/30 focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D]"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#ECF4EE] focus:border-[#0C0D0D]/30 focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D] resize-none"
              />
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Capacity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={formData.capacity}
                onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 0)}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  formErrors.capacity
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-[#ECF4EE] focus:border-[#0C0D0D]/30'
                } focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D]`}
              />
              {formErrors.capacity && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.capacity}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Status
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={formData.is_active}
                    onChange={() => handleChange('is_active', true)}
                    className="h-4 w-4 text-[#0C0D0D] focus:ring-[#0C0D0D]"
                  />
                  <span className="text-sm font-medium text-[#0C0D0D]">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={!formData.is_active}
                    onChange={() => handleChange('is_active', false)}
                    className="h-4 w-4 text-rose-600 focus:ring-rose-600"
                  />
                  <span className="text-sm font-medium text-[#0C0D0D]">Inactive</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isClosed}
                    onChange={(e) => handleChange('isClosed', e.target.checked)}
                    className="h-4 w-4 text-amber-600 focus:ring-amber-600 rounded"
                  />
                  <span className="text-sm font-medium text-[#0C0D0D]">Closed</span>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Schedule Card */}
        <Card className="p-6 border border-[#ECF4EE]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0C0D0D]">Schedule</h3>
              <p className="text-xs text-[#0C0D0D]/60 font-medium">When the seminar takes place</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Day */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Day <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.day}
                onChange={(e) => handleChange('day', parseInt(e.target.value))}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  formErrors.day
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-[#ECF4EE] focus:border-[#0C0D0D]/30'
                } focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D] bg-white`}
              >
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
              {formErrors.day && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.day}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  formErrors.date
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-[#ECF4EE] focus:border-[#0C0D0D]/30'
                } focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D]`}
              />
              {formErrors.date && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.date}</p>
              )}
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Start Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  formErrors.start_time
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-[#ECF4EE] focus:border-[#0C0D0D]/30'
                } focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D]`}
              />
              {formErrors.start_time && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.start_time}</p>
              )}
            </div>

            {/* End Time */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                End Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => handleChange('end_time', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  formErrors.end_time
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-[#ECF4EE] focus:border-[#0C0D0D]/30'
                } focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D]`}
              />
              {formErrors.end_time && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.end_time}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Location Card */}
        <Card className="p-6 border border-[#ECF4EE]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0C0D0D]">Location</h3>
              <p className="text-xs text-[#0C0D0D]/60 font-medium">Where the seminar will be held</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Building */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Building
              </label>
              <select
                value={formData.building}
                onChange={(e) => handleChange('building', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#ECF4EE] focus:border-[#0C0D0D]/30 focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D] bg-white"
              >
                <option value="">Select a building...</option>
                {buildings.map((building) => (
                  <option key={building._id} value={building.name}>
                    {building.name} ({building.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Room */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Room
              </label>
              <input
                type="text"
                placeholder="e.g., Room 101, Hall A"
                value={formData.room}
                onChange={(e) => handleChange('room', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#ECF4EE] focus:border-[#0C0D0D]/30 focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D]"
              />
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2">
          <Button
            type="submit"
            variant="primary"
            className="flex items-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 px-6 py-3 rounded-2xl text-sm font-bold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(`/dashboard/seminars/${id}`)}
            className="bg-white border border-[#ECF4EE] hover:border-[#0C0D0D]/20 px-6 py-3 rounded-2xl text-sm font-bold text-[#0C0D0D]"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}