// src/app/dashboard/sessions/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Save,
  Loader2,
  Building2,
  AlertCircle,
  X,
  ChevronDown,
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { useSession } from '@/src/hooks/useSession';
import { toast } from 'sonner';

const DAYS = [
  { value: 1, label: 'Day 1' },
  { value: 2, label: 'Day 2' },
  { value: 3, label: 'Day 3' },
  { value: 4, label: 'Day 4' },
];

const SESSION_TYPES = [
  { value: 'morning', label: 'Morning Session' },
  { value: 'afternoon', label: 'Afternoon Session' },
];

export default function CreateSessionPage() {
  const router = useRouter();
  // ✅ Use autoFetch: false to prevent automatic fetching
  const { create, isProcessing, error, clearError } = useSession(false);

  const [formData, setFormData] = useState({
    name: '',
    type: 'morning' as 'morning' | 'afternoon',
    day: 1,
    date: '',
    start_time: '09:00',
    end_time: '12:00',
    on_time_start: '08:40',
    on_time_end: '09:05',
    late_end: '09:25',
    room: '',
    building: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Set default date to tomorrow
  useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, date: dateStr }));
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-generate name if name is empty
    if (field === 'type' || field === 'day') {
      const typeLabel = formData.type === 'morning' ? 'Morning' : 'Afternoon';
      const dayLabel = `Day ${formData.day}`;
      const newName = `${typeLabel} Session - ${dayLabel}`;
      setFormData(prev => ({ ...prev, name: newName }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Session name is required';
    }
    if (!formData.type) {
      errors.type = 'Please select a session type';
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
      errors.late_end = 'Late end time is required';
    }
    if (formData.on_time_end >= formData.late_end) {
      errors.late_end = 'Late end must be after on-time end';
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
        type: formData.type,
        day: formData.day,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        on_time_start: formData.on_time_start,
        on_time_end: formData.on_time_end,
        late_end: formData.late_end,
        room: formData.room || undefined,
        building: formData.building || undefined,
      });
      toast.success(`Session "${formData.name}" created successfully`);
      router.push('/dashboard/sessions');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to create session');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/sessions"
          className="p-2 rounded-xl hover:bg-[#ECF4EE] transition-colors text-[#0C0D0D]/60 hover:text-[#0C0D0D]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#0C0D0D]">Create Session</h1>
          <p className="text-xs text-[#0C0D0D]/60 font-medium">Add a new session</p>
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
        {/* Basic Info Card */}
        <Card className="p-6 border border-[#ECF4EE]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0C0D0D]">Session Information</h3>
              <p className="text-xs text-[#0C0D0D]/60 font-medium">Configure session details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Session Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Morning Session - Day 1"
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

            {/* Type */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Session Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange('type', e.target.value)}
                className={`w-full px-4 py-3 bg-[#FAFAFA] border ${
                  formErrors.type ? 'border-rose-300 focus:ring-rose-500' : 'border-[#0C0D0D]/10 focus:ring-[#0C0D0D]'
                } rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 transition-all`}
              >
                {SESSION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {formErrors.type && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.type}</p>
              )}
            </div>

            {/* Day */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Day <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.day}
                onChange={(e) => handleChange('day', parseInt(e.target.value))}
                className={`w-full px-4 py-3 bg-[#FAFAFA] border ${
                  formErrors.day ? 'border-rose-300 focus:ring-rose-500' : 'border-[#0C0D0D]/10 focus:ring-[#0C0D0D]'
                } rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 transition-all`}
              >
                {DAYS.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
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
                className={`w-full px-4 py-3 bg-[#FAFAFA] border ${
                  formErrors.date ? 'border-rose-300 focus:ring-rose-500' : 'border-[#0C0D0D]/10 focus:ring-[#0C0D0D]'
                } rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 transition-all`}
              />
              {formErrors.date && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.date}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Time Windows Card */}
        <Card className="p-6 border border-[#ECF4EE]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0C0D0D]">Time Configuration</h3>
              <p className="text-xs text-[#0C0D0D]/60 font-medium">Set session times and attendance windows</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Start Time */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Start Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => handleChange('start_time', e.target.value)}
                className={`w-full px-4 py-3 bg-[#FAFAFA] border ${
                  formErrors.start_time ? 'border-rose-300 focus:ring-rose-500' : 'border-[#0C0D0D]/10 focus:ring-[#0C0D0D]'
                } rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 transition-all`}
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
                className={`w-full px-4 py-3 bg-[#FAFAFA] border ${
                  formErrors.end_time ? 'border-rose-300 focus:ring-rose-500' : 'border-[#0C0D0D]/10 focus:ring-[#0C0D0D]'
                } rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 transition-all`}
              />
              {formErrors.end_time && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.end_time}</p>
              )}
            </div>

            <div className="md:col-span-2 bg-[#FAFAFA] rounded-2xl p-4 border border-[#ECF4EE]">
              <p className="text-xs font-bold text-[#0C0D0D]/60 uppercase tracking-wider mb-3">Attendance Windows</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* On-time Start */}
                <div>
                  <label className="block text-[10px] font-bold text-[#0C0D0D]/60 uppercase tracking-wider mb-1">
                    On-time Start
                  </label>
                  <input
                    type="time"
                    value={formData.on_time_start}
                    onChange={(e) => handleChange('on_time_start', e.target.value)}
                    className={`w-full px-4 py-2 bg-white border ${
                      formErrors.on_time_start ? 'border-rose-300 focus:ring-rose-500' : 'border-[#0C0D0D]/10 focus:ring-[#0C0D0D]'
                    } rounded-xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 transition-all`}
                  />
                  {formErrors.on_time_start && (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.on_time_start}</p>
                  )}
                </div>

                {/* On-time End */}
                <div>
                  <label className="block text-[10px] font-bold text-[#0C0D0D]/60 uppercase tracking-wider mb-1">
                    On-time End
                  </label>
                  <input
                    type="time"
                    value={formData.on_time_end}
                    onChange={(e) => handleChange('on_time_end', e.target.value)}
                    className={`w-full px-4 py-2 bg-white border ${
                      formErrors.on_time_end ? 'border-rose-300 focus:ring-rose-500' : 'border-[#0C0D0D]/10 focus:ring-[#0C0D0D]'
                    } rounded-xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 transition-all`}
                  />
                  {formErrors.on_time_end && (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.on_time_end}</p>
                  )}
                </div>

                {/* Late End */}
                <div>
                  <label className="block text-[10px] font-bold text-[#0C0D0D]/60 uppercase tracking-wider mb-1">
                    Late End
                  </label>
                  <input
                    type="time"
                    value={formData.late_end}
                    onChange={(e) => handleChange('late_end', e.target.value)}
                    className={`w-full px-4 py-2 bg-white border ${
                      formErrors.late_end ? 'border-rose-300 focus:ring-rose-500' : 'border-[#0C0D0D]/10 focus:ring-[#0C0D0D]'
                    } rounded-xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 transition-all`}
                  />
                  {formErrors.late_end && (
                    <p className="mt-1 text-xs text-rose-600">{formErrors.late_end}</p>
                  )}
                </div>
              </div>
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
              <p className="text-xs text-[#0C0D0D]/60 font-medium">Where the session will be held</p>
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
                placeholder="e.g., Main Hall"
                value={formData.building}
                onChange={(e) => handleChange('building', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all"
              />
            </div>

            {/* Room */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Room
              </label>
              <input
                type="text"
                placeholder="e.g., Room 101"
                value={formData.room}
                onChange={(e) => handleChange('room', e.target.value)}
                className="w-full px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all"
              />
            </div>
          </div>
        </Card>

        {/* Preview Card */}
        <Card className="p-6 border border-[#ECF4EE] bg-[#ECF4EE]/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#0C0D0D]">Session Preview</h4>
              <p className="text-xs text-[#0C0D0D]/60 font-medium">Review session details</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between p-2 bg-white rounded-xl">
              <span className="text-[#0C0D0D]/60">Name</span>
              <span className="font-bold text-[#0C0D0D]">{formData.name || 'Not set'}</span>
            </div>
            <div className="flex justify-between p-2 bg-white rounded-xl">
              <span className="text-[#0C0D0D]/60">Type</span>
              <span className="font-bold text-[#0C0D0D]">{SESSION_TYPES.find(t => t.value === formData.type)?.label || 'Not set'}</span>
            </div>
            <div className="flex justify-between p-2 bg-white rounded-xl">
              <span className="text-[#0C0D0D]/60">Day</span>
              <span className="font-bold text-[#0C0D0D]">Day {formData.day}</span>
            </div>
            <div className="flex justify-between p-2 bg-white rounded-xl">
              <span className="text-[#0C0D0D]/60">Date</span>
              <span className="font-bold text-[#0C0D0D]">{formData.date || 'Not set'}</span>
            </div>
            <div className="flex justify-between p-2 bg-white rounded-xl sm:col-span-2">
              <span className="text-[#0C0D0D]/60">Time</span>
              <span className="font-bold text-[#0C0D0D]">{formData.start_time} - {formData.end_time}</span>
            </div>
            <div className="flex justify-between p-2 bg-white rounded-xl sm:col-span-2">
              <span className="text-[#0C0D0D]/60">Attendance Windows</span>
              <span className="font-bold text-[#0C0D0D] text-xs">
                On-time: {formData.on_time_start} - {formData.on_time_end} | Late: {formData.on_time_end} - {formData.late_end}
              </span>
            </div>
            {(formData.building || formData.room) && (
              <div className="flex justify-between p-2 bg-white rounded-xl sm:col-span-2">
                <span className="text-[#0C0D0D]/60">Location</span>
                <span className="font-bold text-[#0C0D0D]">{formData.building}{formData.room ? `, ${formData.room}` : ''}</span>
              </div>
            )}
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
                Create Session
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push('/dashboard/sessions')}
            className="flex-1 rounded-2xl border-[#0C0D0D]/10 bg-[#FAFAFA] text-[#0C0D0D] font-bold"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}