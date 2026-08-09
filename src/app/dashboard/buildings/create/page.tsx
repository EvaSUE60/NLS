// src/app/dashboard/buildings/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Save,
  Info,
  Loader2,
  Sparkles,
  Layers,
  BedDouble,
  Home,
  DoorOpen
} from 'lucide-react';
import { Badge } from '@/src/components/ui/Badge';
import { useBuilding } from '@/src/hooks/useBuilding';
import { toast } from 'sonner';

export default function CreateBuildingPage() {
  const router = useRouter();
  const { createBuilding, isLoading } = useBuilding();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'men' as 'men' | 'women',
    total_floors: 3,
    rooms_per_floor: 10,
    default_capacity: 4,
    address: '',
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Building name is required';
    if (!formData.type) newErrors.type = 'Building type is required';
    if (!formData.total_floors || formData.total_floors < 1) newErrors.total_floors = 'At least 1 floor is required';
    if (!formData.rooms_per_floor || formData.rooms_per_floor < 1) newErrors.rooms_per_floor = 'At least 1 room per floor is required';
    if (!formData.default_capacity || formData.default_capacity < 2) newErrors.default_capacity = 'Capacity must be at least 2';
    if (formData.default_capacity > 25) newErrors.default_capacity = 'Capacity cannot exceed 25';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix all validation errors');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Submitting building data:', formData);
      const result = await createBuilding(formData);
      console.log('Building created:', result);
      toast.success(`Building "${formData.name}" created successfully!`);
      router.push('/dashboard/buildings');
    } catch (error: any) {
      console.error('Error creating building:', error);
      toast.error(error?.message || 'Failed to create building');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalRooms = formData.total_floors * formData.rooms_per_floor;
  const totalBeds = totalRooms * formData.default_capacity;

  // Generate capacity options from 2 to 25
  const capacityOptions = Array.from({ length: 24 }, (_, i) => i + 2);

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-2 sm:p-4">
      {/* ==================== HERO / HEADER BANNER ==================== */}
      <div className="relative overflow-hidden rounded-3xl bg-[#ECF4EE] border border-[#d2e5d7] p-6 sm:p-8 text-[#0C0D0D] shadow-sm">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#0C0D0D]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/buildings"
              className="p-3 rounded-2xl bg-white/80 hover:bg-white text-[#0C0D0D] border border-[#0C0D0D]/10 transition-all shadow-2xs cursor-pointer group"
            >
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            </Link>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#0C0D0D] text-[#ECF4EE]">
                  <Sparkles className="w-3 h-3 text-[#ECF4EE]" /> Setup Wizard
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0C0D0D]">
                Create New Building
              </h1>
              <p className="text-xs sm:text-sm text-[#0C0D0D]/70 font-medium">
                Add a new dormitory building with automated room generation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== FORM & SIDEBAR ==================== */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 sm:p-8 text-[#0C0D0D] shadow-xs">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#ECF4EE]">
                <div className="p-3 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0C0D0D]">Building Configuration</h3>
                  <p className="text-xs text-[#0C0D0D]/50 font-medium">Specify basic identification and structural metadata</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Building Name */}
                <div>
                  <label className="block text-xs font-bold text-[#0C0D0D] uppercase tracking-wider mb-2">
                    Building Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Men's Main Block"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-2xl text-xs font-medium text-[#0C0D0D] placeholder-[#0C0D0D]/40 focus:outline-none transition-all shadow-2xs ${
                      errors.name 
                        ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' 
                        : 'border-[#ECF4EE] focus:border-[#0C0D0D]/30'
                    }`}
                  />
                  {errors.name && <p className="mt-1.5 text-xs font-semibold text-rose-600">{errors.name}</p>}
                </div>

                {/* Building Type */}
                <div>
                  <label className="block text-xs font-bold text-[#0C0D0D] uppercase tracking-wider mb-2">
                    Building Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#ECF4EE] focus:border-[#0C0D0D]/30 rounded-2xl text-xs font-medium text-[#0C0D0D] focus:outline-none transition-all shadow-2xs cursor-pointer"
                  >
                    <option value="men">Men</option>
                    <option value="women">Women</option>
                  </select>
                </div>

                {/* Total Floors */}
                <div>
                  <label className="block text-xs font-bold text-[#0C0D0D] uppercase tracking-wider mb-2">
                    Number of Floors <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.total_floors}
                    onChange={(e) => handleChange('total_floors', parseInt(e.target.value) || 0)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-2xl text-xs font-medium text-[#0C0D0D] focus:outline-none transition-all shadow-2xs ${
                      errors.total_floors 
                        ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' 
                        : 'border-[#ECF4EE] focus:border-[#0C0D0D]/30'
                    }`}
                  />
                  {errors.total_floors && <p className="mt-1.5 text-xs font-semibold text-rose-600">{errors.total_floors}</p>}
                </div>

                {/* Rooms Per Floor */}
                <div>
                  <label className="block text-xs font-bold text-[#0C0D0D] uppercase tracking-wider mb-2">
                    Rooms per Floor <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.rooms_per_floor}
                    onChange={(e) => handleChange('rooms_per_floor', parseInt(e.target.value) || 0)}
                    className={`w-full px-4 py-2.5 bg-white border rounded-2xl text-xs font-medium text-[#0C0D0D] focus:outline-none transition-all shadow-2xs ${
                      errors.rooms_per_floor 
                        ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20' 
                        : 'border-[#ECF4EE] focus:border-[#0C0D0D]/30'
                    }`}
                  />
                  {errors.rooms_per_floor && <p className="mt-1.5 text-xs font-semibold text-rose-600">{errors.rooms_per_floor}</p>}
                </div>

                {/* Room Capacity - Updated to 25 */}
                <div>
                  <label className="block text-xs font-bold text-[#0C0D0D] uppercase tracking-wider mb-2">
                    Default Room Capacity <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.default_capacity}
                    onChange={(e) => handleChange('default_capacity', parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border border-[#ECF4EE] focus:border-[#0C0D0D]/30 rounded-2xl text-xs font-medium text-[#0C0D0D] focus:outline-none transition-all shadow-2xs cursor-pointer"
                  >
                    {capacityOptions.map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'bed' : 'beds'} per room
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] text-[#0C0D0D]/40 font-medium">
                    Maximum capacity is 25 beds per room
                  </p>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#0C0D0D] uppercase tracking-wider mb-2">
                    Address / Location <span className="text-[#0C0D0D]/40 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Main Campus, East Sector Block B"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-[#ECF4EE] focus:border-[#0C0D0D]/30 rounded-2xl text-xs font-medium text-[#0C0D0D] placeholder-[#0C0D0D]/40 focus:outline-none transition-all shadow-2xs"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#0C0D0D] uppercase tracking-wider mb-2">
                    Description <span className="text-[#0C0D0D]/40 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    placeholder="Provide additional details or notes regarding this facility..."
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-white border border-[#ECF4EE] focus:border-[#0C0D0D]/30 rounded-2xl text-xs font-medium text-[#0C0D0D] placeholder-[#0C0D0D]/40 focus:outline-none transition-all shadow-2xs resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Summary & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Summary Card */}
            <div className="bg-[#ECF4EE] rounded-3xl border border-[#d2e5d7] p-6 text-[#0C0D0D] shadow-xs space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#0C0D0D]/60 pb-2 border-b border-[#0C0D0D]/10">
                Building Summary
              </h4>

              <div className="space-y-3 text-xs font-medium">
                <div className="flex justify-between items-center">
                  <span className="text-[#0C0D0D]/60 flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5" /> Building Name
                  </span>
                  <span className="font-extrabold text-[#0C0D0D] truncate max-w-[140px]">
                    {formData.name || 'Not set'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#0C0D0D]/60">Designation</span>
                  <Badge 
                    variant="info" 
                    className={`capitalize text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${
                      formData.type === 'men' 
                        ? 'bg-sky-50 text-sky-800 border-sky-200' 
                        : 'bg-pink-50 text-pink-800 border-pink-200'
                    }`}
                  >
                    {formData.type}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#0C0D0D]/60 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Total Floors
                  </span>
                  <span className="font-extrabold text-[#0C0D0D]">{formData.total_floors}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#0C0D0D]/60 flex items-center gap-1.5">
                    <DoorOpen className="w-3.5 h-3.5" /> Rooms / Floor
                  </span>
                  <span className="font-extrabold text-[#0C0D0D]">{formData.rooms_per_floor}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#0C0D0D]/60 flex items-center gap-1.5">
                    <BedDouble className="w-3.5 h-3.5" /> Room Capacity
                  </span>
                  <span className="font-extrabold text-[#0C0D0D]">{formData.default_capacity} beds</span>
                </div>

                <div className="pt-3 border-t border-[#0C0D0D]/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[#0C0D0D]/70 font-bold">Total Calculated Rooms</span>
                    <span className="text-sm font-black text-[#0C0D0D]">{totalRooms.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#0C0D0D]/70 font-bold">Total Expected Beds</span>
                    <span className="text-base font-black text-emerald-700">{totalBeds.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-3xl p-5 text-amber-900 shadow-2xs">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase tracking-wider text-amber-900">
                    Auto-Room Generation
                  </p>
                  <p className="text-xs text-amber-800/80 font-medium leading-relaxed">
                    Rooms and bed slots will be automatically provisioned in sequence according to your floor and capacity configuration.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit / Cancel Actions */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 transition-all px-5 py-3 rounded-2xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#ECF4EE]" />
                    Creating Building...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Building
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/dashboard/buildings')}
                className="w-full text-center bg-white border border-[#ECF4EE] hover:border-[#0C0D0D]/20 text-[#0C0D0D] transition-all px-5 py-3 rounded-2xl text-xs font-bold shadow-2xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}