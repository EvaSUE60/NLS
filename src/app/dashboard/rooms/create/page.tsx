// src/app/dashboard/rooms/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  DoorOpen,
  Save,
  Loader2,
  Building2,
  Sparkles,
  Plus
} from 'lucide-react';
import { Badge } from '@/src/components/ui/Badge';
import { useRoom } from '@/src/hooks/useRoom';
import { useBuilding } from '@/src/hooks/useBuilding';
import { toast } from 'sonner';

export default function CreateRoomPage() {
  const router = useRouter();
  
  const {
    create,
    isLoading: roomLoading,
    error: roomError,
    clearError,
  } = useRoom();

  const { buildings, fetchBuildings, isLoading: buildingsLoading } = useBuilding();

  const [formData, setFormData] = useState({
    building_id: '',
    room_number: '',
    floor: 1,
    capacity: 4,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ==================== FETCH BUILDINGS ONLY ====================
  useEffect(() => {
    fetchBuildings();
  }, [fetchBuildings]);

  // ==================== HANDLE CHANGES ====================
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // ==================== VALIDATION ====================
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.building_id) {
      errors.building_id = 'Please select a building';
    }
    
    if (!formData.room_number.trim()) {
      errors.room_number = 'Room number is required';
    }
    
    if (!formData.floor || formData.floor < 1) {
      errors.floor = 'Floor must be at least 1';
    }
    
    if (formData.floor > 10) {
      errors.floor = 'Floor cannot exceed 10';
    }
    
    if (!formData.capacity || formData.capacity < 2) {
      errors.capacity = 'Capacity must be at least 2';
    }
    
    if (formData.capacity > 25) {
      errors.capacity = 'Capacity cannot exceed 25';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ==================== SUBMIT ====================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix all validation errors');
      return;
    }

    setIsSubmitting(true);
    try {
      const createData = {
        building_id: formData.building_id,
        room_number: formData.room_number,
        floor: formData.floor,
        capacity: formData.capacity,
      };

      const newRoom = await create(createData);
      
      toast.success(`Room ${formData.room_number} created successfully!`);
      router.push(`/dashboard/rooms/${newRoom._id}`);
    } catch (error: any) {
      console.error('Create error:', error);
      toast.error(error?.message || 'Failed to create room');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== LOADING STATE ====================
  if (buildingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-3xl bg-[#ECF4EE]/40 border border-[#ECF4EE] text-[#0C0D0D]">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#0C0D0D]/5 blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 text-[#0C0D0D] animate-spin relative z-10" />
        </div>
        <p className="mt-4 text-xs font-bold text-[#0C0D0D]/60 tracking-wider uppercase">
          Loading buildings...
        </p>
      </div>
    );
  }

  // ==================== ERROR STATE ====================
  if (roomError) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
        <p className="text-rose-700 font-medium">Error: {roomError}</p>
        <button 
          onClick={() => { clearError(); }}
          className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold cursor-pointer transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  const selectedBuilding = buildings.find(b => b._id === formData.building_id);

  // ==================== MAIN RENDER ====================
  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-2 sm:p-4">
      {/* ==================== HERO BANNER HEADER ==================== */}
      <div className="relative overflow-hidden rounded-3xl bg-[#ECF4EE] border border-[#d2e5d7] p-6 sm:p-8 text-[#0C0D0D] shadow-sm">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#0C0D0D]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <Link
              href="/dashboard/rooms"
              className="p-2.5 bg-white/80 hover:bg-white text-[#0C0D0D] border border-[#0C0D0D]/10 rounded-2xl transition-all shadow-2xs mt-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#0C0D0D] text-[#ECF4EE]">
                  <Sparkles className="w-3 h-3 text-[#ECF4EE]" /> Room Setup
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0C0D0D]">
                Create New Room
              </h1>
              <p className="text-xs sm:text-sm text-[#0C0D0D]/70 font-medium">
                Add a new accommodation room to an existing building.
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/80 text-[#0C0D0D] border border-[#0C0D0D]/10 self-start md:self-auto">
            <Plus className="h-3.5 w-3.5 text-[#0C0D0D]" />
            New Room
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ==================== MAIN FORM ==================== */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-[#ECF4EE]">
                <div className="p-2.5 bg-[#ECF4EE] rounded-2xl text-[#0C0D0D]">
                  <DoorOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0C0D0D]">Room Details</h3>
                  <p className="text-xs text-[#0C0D0D]/50">Configure capacity and structural assignment</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Building Selection */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#0C0D0D] uppercase tracking-wider mb-2">
                    Building <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.building_id}
                    onChange={(e) => handleChange('building_id', e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border ${
                      formErrors.building_id 
                        ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20' 
                        : 'border-[#ECF4EE] focus:border-[#0C0D0D] bg-[#ECF4EE]/20'
                    } text-xs font-semibold text-[#0C0D0D] focus:outline-none transition-all cursor-pointer`}
                  >
                    <option value="">Select a building...</option>
                    {buildings.map((building) => (
                      <option key={building._id} value={building._id}>
                        {building.name} ({building.type === 'men' ? "Men's" : "Women's"}) 
                        {building.code ? ` - ${building.code}` : ''}
                      </option>
                    ))}
                  </select>
                  {formErrors.building_id && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-600">{formErrors.building_id}</p>
                  )}
                  {buildings.length === 0 && (
                    <p className="mt-1.5 text-xs font-semibold text-amber-700">
                      No buildings available. Please create a building first.
                    </p>
                  )}
                </div>

                {/* Room Number */}
                <div>
                  <label className="block text-xs font-bold text-[#0C0D0D] uppercase tracking-wider mb-2">
                    Room Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 1-01"
                    value={formData.room_number}
                    onChange={(e) => handleChange('room_number', e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border ${
                      formErrors.room_number 
                        ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20' 
                        : 'border-[#ECF4EE] focus:border-[#0C0D0D] bg-[#ECF4EE]/20'
                    } text-xs font-semibold text-[#0C0D0D] focus:outline-none transition-all`}
                  />
                  {formErrors.room_number && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-600">{formErrors.room_number}</p>
                  )}
                  <p className="mt-1.5 text-[10px] font-medium text-[#0C0D0D]/50">
                    Format: Floor-Room (e.g., 1-01 for Ground floor, room 1)
                  </p>
                </div>

                {/* Floor */}
                <div>
                  <label className="block text-xs font-bold text-[#0C0D0D] uppercase tracking-wider mb-2">
                    Floor <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.floor}
                    onChange={(e) => handleChange('floor', parseInt(e.target.value) || 0)}
                    className={`w-full px-4 py-3 rounded-2xl border ${
                      formErrors.floor 
                        ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20' 
                        : 'border-[#ECF4EE] focus:border-[#0C0D0D] bg-[#ECF4EE]/20'
                    } text-xs font-semibold text-[#0C0D0D] focus:outline-none transition-all`}
                  />
                  {formErrors.floor && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-600">{formErrors.floor}</p>
                  )}
                  <p className="mt-1.5 text-[10px] font-medium text-[#0C0D0D]/50">
                    Floor number (1 = Ground floor)
                  </p>
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-xs font-bold text-[#0C0D0D] uppercase tracking-wider mb-2">
                    Capacity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="25"
                    value={formData.capacity}
                    onChange={(e) => handleChange('capacity', parseInt(e.target.value) || 0)}
                    className={`w-full px-4 py-3 rounded-2xl border ${
                      formErrors.capacity 
                        ? 'border-rose-300 focus:ring-rose-500 bg-rose-50/20' 
                        : 'border-[#ECF4EE] focus:border-[#0C0D0D] bg-[#ECF4EE]/20'
                    } text-xs font-semibold text-[#0C0D0D] focus:outline-none transition-all`}
                  />
                  {formErrors.capacity && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-600">{formErrors.capacity}</p>
                  )}
                  <p className="mt-1.5 text-[10px] font-medium text-[#0C0D0D]/50">
                    Minimum: 2 beds, Maximum: 25 beds
                  </p>
                </div>

                {/* Info Note */}
                <div className="md:col-span-2 bg-[#ECF4EE]/60 border border-[#d2e5d7] rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-[#0C0D0D] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-extrabold text-[#0C0D0D]">Room Creation Info</p>
                      <ul className="text-[11px] font-medium text-[#0C0D0D]/70 mt-1 space-y-0.5 list-disc list-inside">
                        <li>Rooms are automatically assigned bed numbers (1 to capacity).</li>
                        <li>Room status will be set to active by default.</li>
                        <li>You can edit room details and settings after creation.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================== SIDEBAR ==================== */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#0C0D0D]/40">Room Preview</h4>
              <div className="space-y-3 text-xs font-semibold text-[#0C0D0D]">
                <div className="flex justify-between">
                  <span className="text-[#0C0D0D]/50">Building</span>
                  <span className="font-extrabold">
                    {selectedBuilding ? selectedBuilding.name : 'Not selected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0C0D0D]/50">Room Number</span>
                  <span className="font-extrabold">{formData.room_number || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0C0D0D]/50">Floor</span>
                  <span className="font-extrabold">{formData.floor || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0C0D0D]/50">Capacity</span>
                  <span className="font-extrabold">{formData.capacity} beds</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#0C0D0D]/50">Status</span>
                  <Badge variant="success" className="text-[10px] font-bold">Active (Default)</Badge>
                </div>
                <div className="pt-3 border-t border-[#ECF4EE]">
                  <div className="flex justify-between">
                    <span className="text-[#0C0D0D]/50">Bed Numbers</span>
                    <span className="font-extrabold text-[#0C0D0D]">
                      {formData.capacity > 0 ? `1 - ${formData.capacity}` : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================== ACTION BUTTONS ==================== */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSubmitting || buildings.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 disabled:opacity-50 rounded-2xl py-3 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#ECF4EE]" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 text-[#ECF4EE]" />
                    Create Room
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard/rooms')}
                className="w-full flex items-center justify-center bg-[#ECF4EE] text-[#0C0D0D] hover:bg-[#d2e5d7] rounded-2xl py-3 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>

            {/* Building Count */}
            <div className="bg-[#ECF4EE]/40 border border-[#ECF4EE] rounded-2xl p-4 text-xs font-medium text-[#0C0D0D]">
              <div className="flex items-center justify-between">
                <span className="text-[#0C0D0D]/60 font-semibold">Available Buildings</span>
                <span className="px-2.5 py-0.5 rounded-full bg-white text-[#0C0D0D] font-extrabold border border-[#0C0D0D]/10">
                  {buildings.length}
                </span>
              </div>
              {buildings.length === 0 && (
                <p className="text-[11px] font-semibold text-amber-700 mt-2">
                  No buildings found. Please create a building first.
                </p>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}