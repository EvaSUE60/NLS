// src/app/dashboard/seminars/generate/page.tsx
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
  Zap,
  Sparkles,
  AlertCircle,
  X,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
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

export default function GenerateSeminarsPage() {
  const router = useRouter();
  const { generate, isLoading: seminarLoading, error: seminarError, clearError } = useSeminar();

  const [formData, setFormData] = useState({
    days: [1, 2, 3, 4],
    date: '',
    start_time: '09:00',
    end_time: '10:30',
    room_prefix: 'Seminar',
    building: 'Main Hall',
    capacity: 30,
  });

  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    SEMINAR_TYPES.map(t => t.id)
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, date: dateStr }));
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId)
        ? prev.filter(t => t !== topicId)
        : [...prev, topicId]
    );
  };

  const handleDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day].sort()
    }));
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    if (category === 'all') {
      setSelectedTopics(SEMINAR_TYPES.map(t => t.id));
    } else {
      const categoryTopics = SEMINAR_TYPES
        .filter(t => t.category === category)
        .map(t => t.id);
      setSelectedTopics(categoryTopics);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (formData.days.length === 0) {
      errors.days = 'Select at least one day';
    }
    if (!formData.date) {
      errors.date = 'Please select a start date';
    }
    if (selectedTopics.length === 0) {
      errors.topics = 'Select at least one topic';
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

  const generatePreview = () => {
    if (!validateForm()) {
      toast.error('Please fix all validation errors');
      return;
    }

    const totalSeminars = formData.days.length * selectedTopics.length;
    const previewData = {
      days: formData.days.map(day => ({
        day,
        date: new Date(new Date(formData.date).getTime() + (day - 1) * 86400000).toISOString().split('T')[0],
        seminars: selectedTopics.map(topicId => {
          const topic = SEMINAR_TYPES.find(t => t.id === topicId);
          return {
            topic: topic?.name || topicId,
            key: `${topicId}-${String(day).padStart(2, '0')}`,
            time: formData.start_time + ' - ' + formData.end_time,
            room: `${formData.room_prefix}-${Math.floor(Math.random() * 10) + 1}`,
            building: formData.building,
          };
        })
      })),
      total: totalSeminars,
    };
    setPreview(previewData);
    setIsPreviewOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix all validation errors');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await generate({
        days: formData.days,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        room_prefix: formData.room_prefix,
        building: formData.building,
        capacity: formData.capacity,
      });

      // ✅ Show success message with details
      const created = result?.data?.created || 0;
      const skipped = result?.data?.skipped || 0;
      const total = result?.data?.total_seminars || 0;
      
      toast.success(
        `✅ Generated ${created} seminars successfully!${skipped > 0 ? ` (${skipped} skipped, ${total} total)` : ''}`
      );
      
      // Redirect after a short delay to let the user see the success message
      setTimeout(() => {
        router.push('/dashboard/seminars');
      }, 1500);
    } catch (error: any) {
      console.error('Generate error:', error);
      toast.error(error?.message || 'Failed to generate seminars');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = getSeminarCategories();
  const filteredTopics = selectedCategory === 'all' 
    ? SEMINAR_TYPES 
    : SEMINAR_TYPES.filter(t => t.category === selectedCategory);

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
          <h1 className="text-2xl font-black text-[#0C0D0D]">Generate Seminars</h1>
          <p className="text-xs text-[#0C0D0D]/60 font-medium">Bulk create seminars from predefined topics</p>
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
        {/* Schedule Card */}
        <Card className="p-6 border border-[#ECF4EE]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0C0D0D]">Schedule Configuration</h3>
              <p className="text-xs text-[#0C0D0D]/60 font-medium">Select which days and times</p>
            </div>
          </div>

          <div className="space-y-5">
            {/* Days Selection */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-2 uppercase tracking-wider">
                Select Days <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      formData.days.includes(day.value)
                        ? 'bg-[#0C0D0D] text-[#ECF4EE]'
                        : 'bg-[#ECF4EE] text-[#0C0D0D]/60 hover:bg-[#ECF4EE]/80'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              {formErrors.days && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.days}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Start Date <span className="text-rose-500">*</span>
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
              <p className="mt-1 text-xs text-[#0C0D0D]/40">Seminars will be scheduled on consecutive days from this date</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Start Time */}
              <div>
                <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => handleChange('start_time', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#ECF4EE] focus:border-[#0C0D0D]/30 focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D]"
                />
              </div>

              {/* End Time */}
              <div>
                <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => handleChange('end_time', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#ECF4EE] focus:border-[#0C0D0D]/30 focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D]"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Topics Card */}
        <Card className="p-6 border border-[#ECF4EE]">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#0C0D0D]">Topics & Categories</h3>
              <p className="text-xs text-[#0C0D0D]/60 font-medium">Select topics to generate seminars for</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Filter by Category
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleCategorySelect('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-[#0C0D0D] text-[#ECF4EE]'
                      : 'bg-[#ECF4EE] text-[#0C0D0D]/60 hover:bg-[#ECF4EE]/80'
                  }`}
                >
                  All ({SEMINAR_TYPES.length})
                </button>
                {categories.map((category) => {
                  const count = SEMINAR_TYPES.filter(t => t.category === category).length;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategorySelect(category)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        selectedCategory === category
                          ? 'bg-[#0C0D0D] text-[#ECF4EE]'
                          : 'bg-[#ECF4EE] text-[#0C0D0D]/60 hover:bg-[#ECF4EE]/80'
                      }`}
                    >
                      {category} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topic Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#0C0D0D] uppercase tracking-wider">
                  Select Topics <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = filteredTopics.map(t => t.id);
                      if (selectedTopics.length === allIds.length && allIds.every(id => selectedTopics.includes(id))) {
                        setSelectedTopics([]);
                      } else {
                        setSelectedTopics(allIds);
                      }
                    }}
                    className="text-xs font-bold text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors"
                  >
                    {selectedTopics.length === filteredTopics.length && filteredTopics.every(t => selectedTopics.includes(t.id))
                      ? 'Deselect All'
                      : 'Select All'}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                {filteredTopics.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => handleTopicToggle(topic.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                      selectedTopics.includes(topic.id)
                        ? 'bg-[#0C0D0D] text-[#ECF4EE]'
                        : 'bg-[#ECF4EE] text-[#0C0D0D]/60 hover:bg-[#ECF4EE]/80'
                    }`}
                  >
                    <span className="truncate">{topic.name}</span>
                    {selectedTopics.includes(topic.id) && (
                      <CheckCircle2 className="h-3 w-3 ml-auto flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
              {formErrors.topics && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.topics}</p>
              )}
              <p className="mt-2 text-xs text-[#0C0D0D]/40">
                {selectedTopics.length} topics selected • {formData.days.length} days • {selectedTopics.length * formData.days.length} seminars total
              </p>
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
              <h3 className="font-bold text-[#0C0D0D]">Location & Capacity</h3>
              <p className="text-xs text-[#0C0D0D]/60 font-medium">Where the seminars will be held</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Building */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Building <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Main Hall"
                value={formData.building}
                onChange={(e) => handleChange('building', e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl border ${
                  formErrors.building
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-[#ECF4EE] focus:border-[#0C0D0D]/30'
                } focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D]`}
              />
              {formErrors.building && (
                <p className="mt-1 text-xs text-rose-600">{formErrors.building}</p>
              )}
            </div>

            {/* Room Prefix */}
            <div>
              <label className="block text-xs font-bold text-[#0C0D0D] mb-1.5 uppercase tracking-wider">
                Room Prefix
              </label>
              <input
                type="text"
                placeholder="e.g., Seminar, Room"
                value={formData.room_prefix}
                onChange={(e) => handleChange('room_prefix', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#ECF4EE] focus:border-[#0C0D0D]/30 focus:outline-none focus:ring-2 focus:ring-[#0C0D0D]/10 transition text-sm font-medium text-[#0C0D0D]"
              />
              <p className="mt-1 text-xs text-[#0C0D0D]/40">Will be combined with a number (e.g., Seminar-1, Seminar-2)</p>
            </div>

            {/* Capacity */}
            <div className="md:col-span-2">
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
            </div>
          </div>
        </Card>

        {/* Preview */}
        {preview && isPreviewOpen && (
          <Card className="p-6 border border-[#ECF4EE] bg-[#ECF4EE]/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-[#0C0D0D]">Preview</h4>
                  <p className="text-xs text-[#0C0D0D]/60 font-medium">
                    {preview.total} seminars will be generated
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success" className="text-xs font-bold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border-emerald-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1 rounded-lg hover:bg-[#ECF4EE] transition-colors"
                >
                  <X className="h-4 w-4 text-[#0C0D0D]/60" />
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {preview.days.map((day: any) => (
                <div key={day.day} className="bg-white rounded-xl p-4 border border-[#ECF4EE]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-[#0C0D0D] text-sm">Day {day.day}</span>
                    <span className="text-xs text-[#0C0D0D]/50">{day.date}</span>
                    <span className="text-xs font-bold text-[#0C0D0D]/60">{day.seminars.length} seminars</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {day.seminars.map((seminar: any) => (
                      <Badge key={seminar.key} variant="info" className="text-xs bg-[#ECF4EE] text-[#0C0D0D] border-[#ECF4EE]">
                        {seminar.topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 flex-wrap">
          <Button
            type="button"
            onClick={generatePreview}
            className="flex items-center gap-2 bg-[#ECF4EE] text-[#0C0D0D] hover:bg-[#ECF4EE]/80 px-6 py-3 rounded-2xl text-sm font-bold"
          >
            <Info className="h-4 w-4" />
            Preview
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex items-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 px-6 py-3 rounded-2xl text-sm font-bold"
            disabled={isSubmitting || seminarLoading}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Generate Seminars
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