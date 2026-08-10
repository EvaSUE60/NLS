// src/app/dashboard/seminars/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
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
  ChevronDown,
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { useSeminar } from '@/src/hooks/useSeminar';
import { toast } from 'sonner';
import { SEMINAR_TYPES, getSeminarCategories } from '@/src/data/seminars';

const DAYS = [
  { value: 1, label: 'Day 1' },
  { value: 2, label: 'Day 2' },
  { value: 3, label: 'Day 3' },
  { value: 4, label: 'Day 4' },
];

export default function CreateSeminarPage() {
  const router = useRouter();
  const { create, isLoading: seminarLoading, error: seminarError, clearError } = useSeminar();

  const [formData, setFormData] = useState({
    seminar_key: '',
    name: '',
    category: '',
    description: '',
    day: 1,
    date: '',
    start_time: '09:00',
    end_time: '10:30',
    on_time_start: '08:45',
    on_time_end: '09:15',
    late_end: '09:30',
    room: '',
    building: '',
    capacity: 30,
  });

  const [selectedSeminarType, setSelectedSeminarType] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, date: dateStr }));
  }, []);

  // Auto-fill form when seminar type is selected
  const handleSeminarTypeSelect = (seminarId: string) => {
    const seminar = SEMINAR_TYPES.find(s => s.id === seminarId);
    if (seminar) {
      setSelectedSeminarType(seminarId);
      setFormData(prev => ({
        ...prev,
        seminar_key: seminar.id,
        name: seminar.name,
        category: seminar.category || '',
        description: seminar.description || '',
      }));
      // Clear any errors for these fields
      setFormErrors(prev => ({
        ...prev,
        seminar_key: '',
        name: '',
        category: '',
        description: '',
      }));
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.seminar_key.trim()) {
      errors.seminar_key = 'Seminar key is required';
    }
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
    if (!formData.on_time_start) {
      errors.on_time_start = 'On-time start is required';
    }
    if (!formData.on_time_end) {
      errors.on_time_end = 'On-time end is required';
    }
    if (!formData.late_end) {
      errors.late_end = 'Late end is required';
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
      await create({
        seminar_key: formData.seminar_key,
        name: formData.name,
        category: formData.category || undefined,
        description: formData.description || undefined,
        day: formData.day,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        on_time_start: formData.on_time_start,
        on_time_end: formData.on_time_end,
        late_end: formData.late_end,
        room: formData.room || undefined,
        building: formData.building || undefined,
        capacity: formData.capacity,
      });
      toast.success(`Seminar "${formData.name}" created successfully`);
      router.push('/dashboard/seminars');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create seminar');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get unique categories for display
  const categories = getSeminarCategories();

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/seminars"
          className="p-2 rounded-xl hover:bg-[#ECF4EE] transition-colors text-[#0C0D0D]/60 hover:text-[#0C0D0D]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#0C0D0D]">Create New Seminar</h1>
          <p className="text-xs text-[#0C0D0D]/60 font-medium">Add a new seminar session</p>
        </div>
      </div>

      {seminarError && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
          <p className="text-sm text-rose-700 font-medium">{seminarError}</p>
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
              <h3 className="font-bold text-[#0C0D0D]">Seminar Information</h3>
              <p className="text-xs text-[#0C0D0D]/60 font-medium">Select a seminar type or enter custom details</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Seminar Type Dropdown */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Select Seminar Type
              </label>
              <div className="relative">
                <select
                  value={selectedSeminarType}
                  onChange={(e) => handleSeminarTypeSelect(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#ECF4EE] focus:border-[#0C0D0D]/30 focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D] bg-white appearance-none"
                >
                  <option value="">Choose a seminar type...</option>
                  {categories.map((category) => (
                    <optgroup key={category} label={category}>
                      {SEMINAR_TYPES
                        .filter(s => s.category === category)
                        .map((seminar) => (
                          <option key={seminar.id} value={seminar.id}>
                            {seminar.name}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0C0D0D]/40 pointer-events-none" />
              </div>
              <p className="mt-1 text-xs text-[#0C0D0D]/40">Select a seminar type to auto-fill the details below</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Seminar Key */}
              <div>
                <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                  Seminar Key <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., engaging-islam"
                  value={formData.seminar_key}
                  onChange={(e) => handleChange('seminar_key', e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    formErrors.seminar_key
                      ? 'border-rose-300 focus:ring-rose-500'
                      : 'border-[#ECF4EE] focus:border-[#0C0D0D]/30'
                  } focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D]`}
                />
                {formErrors.seminar_key && (
                  <p className="mt-1 text-xs text-rose-600">{formErrors.seminar_key}</p>
                )}
                <p className="mt-1 text-xs text-[#0C0D0D]/40">Unique identifier (e.g., engaging-islam)</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                  Seminar Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Engaging Islam"
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
                  placeholder="e.g., Apologetics, Leadership"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#ECF4EE] focus:border-[#0C0D0D]/30 focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D]"
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
                  placeholder="30"
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
                <p className="mt-1 text-xs text-[#0C0D0D]/40">Maximum number of attendees</p>
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the seminar content and objectives..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#ECF4EE] focus:border-[#0C0D0D]/30 focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D] resize-none"
                />
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

            {/* On-Time Start */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                On-Time Start <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={formData.on_time_start}
                onChange={(e) => handleChange('on_time_start', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  formErrors.on_time_start
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-[#ECF4EE] focus:border-[#0C0D0D]/30'
                } focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D]`}
              />
              {formErrors.on_time_start && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.on_time_start}</p>
              )}
            </div>

            {/* On-Time End */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                On-Time End <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={formData.on_time_end}
                onChange={(e) => handleChange('on_time_end', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  formErrors.on_time_end
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-[#ECF4EE] focus:border-[#0C0D0D]/30'
                } focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D]`}
              />
              {formErrors.on_time_end && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.on_time_end}</p>
              )}
            </div>

            {/* Late End */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Late End <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={formData.late_end}
                onChange={(e) => handleChange('late_end', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  formErrors.late_end
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-[#ECF4EE] focus:border-[#0C0D0D]/30'
                } focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D]`}
              />
              {formErrors.late_end && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.late_end}</p>
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
              <input
                type="text"
                placeholder="e.g., Main Hall, Conference Center"
                value={formData.building}
                onChange={(e) => handleChange('building', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#ECF4EE] focus:border-[#0C0D0D]/30 focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D]"
              />
            </div>

            {/* Room */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Room
              </label>
              <input
                type="text"
                placeholder="e.g., Seminar-1, Room 101"
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
            disabled={isSubmitting || seminarLoading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create Seminar
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/dashboard/seminars')}
            className="bg-white border border-[#ECF4EE] hover:border-[#0C0D0D]/20 px-6 py-3 rounded-2xl text-sm font-bold text-[#0C0D0D]"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}