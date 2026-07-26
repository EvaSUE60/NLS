// src/app/dashboard/rooms/[id]/edit/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  DoorOpen,
  Save,
  Loader2,
  AlertCircle,
  Sparkles,
  Building2
} from 'lucide-react';
import { Badge } from '@/src/components/ui/Badge';
import { useRoom } from '@/src/hooks/useRoom';
import { useBuilding } from '@/src/hooks/useBuilding';
import { toast } from 'sonner';

interface EditRoomPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditRoomPage({ params }: EditRoomPageProps) {
  const router = useRouter();
  const { id } = use(params);
  
  const {
    selectedRoom: room,
    isLoading,
    error,
    fetchRoom,
    update,
    clearSelected,
    clearError,
  } = useRoom();

  const { fetchBuildings } = useBuilding();

  const [formData, setFormData] = useState({
    room_number: '',
    floor: 1,
    capacity: 4,
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ==================== FETCH DATA ====================
  useEffect(() => {
    fetchRoom(id);
    fetchBuildings();
    return () => {
      clearSelected();
    };
  }, [id, fetchRoom, fetchBuildings, clearSelected]);

  // ==================== POPULATE FORM ====================
  useEffect(() => {
    if (room) {
      setFormData({
        room_number: room.room_number || '',
        floor: room.floor || 1,
        capacity: room.capacity || 4,
        is_active: room.is_active !== undefined ? room.is_active : true,
      });
    }
  }, [room]);

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
    
    if (!formData.room_number.trim()) {
      errors.room_number = 'Room number is required';
    }
    
    if (!formData.floor || formData.floor < 1) {
      errors.floor = 'Floor must be at least 1';
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
      const updateData = {
        room_number: formData.room_number,
        floor: formData.floor,
        capacity: formData.capacity,
        is_active: formData.is_active,
      };

      await update(id, updateData);
      
      toast.success(`Room ${formData.room_number} updated successfully`);
      router.push(`/dashboard/rooms/${id}`);
    } catch (error: any) {
      console.error('Update error:', error);
      toast.error(error?.message || 'Failed to update room');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== LOADING STATE ====================
  if (isLoading && !room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-3xl bg-[#ECF4EE]/40 border border-[#ECF4EE] text-[#0C0D0D]">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#0C0D0D]/5 blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 text-[#0C0D0D] animate-spin relative z-10" />
        </div>
        <p className="mt-4 text-xs font-bold text-[#0C0D0D]/60 tracking-wider uppercase">
          Loading room details...
        </p>
      </div>
    );
  }

  // ==================== ERROR STATE ====================
  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
        <p className="text-rose-700 font-medium">Error loading room: {error}</p>
        <button 
          onClick={() => { 
            clearError(); 
            fetchRoom(id); 
          }}
          className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold cursor-pointer transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  // ==================== NOT FOUND ====================
  if (!room) {
    return (
      <div className="bg-white rounded-3xl border border-[#ECF4EE] p-12 text-center max-w-md mx-auto my-12 shadow-xs">
        <DoorOpen className="h-12 w-12 text-[#0C0D0D]/30 mx-auto mb-4" />
        <h3 className="text-base font-extrabold text-[#0C0D0D]">Room Not Found</h3>
        <p className="text-xs text-[#0C0D0D]/50 mt-1 mb-6">The room you are looking to edit does not exist or has been removed.</p>
        <Link href="/dashboard/rooms">
          <button className="bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold cursor-pointer transition-all">
            Back to Rooms
          </button>
        </Link>
      </div>
    );
  }

  const buildingName = room.building_name || 'Unknown';
  const isMenBuilding = room.building_type === 'men';


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
              href={`/dashboard/rooms/${id}`}
              className="p-2.5 bg-white/80 hover:bg-white text-[#0C0D0D] border border-[#0C0D0D]/10 rounded-2xl transition-all shadow-2xs mt-1"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#0C0D0D] text-[#ECF4EE]">
                  <Sparkles className="w-3 h-3 text-[#ECF4EE]" /> Room Management
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/80 text-[#0C0D0D] border border-[#0C0D0D]/10">
                  <Building2 className="h-3 w-3 text-[#0C0D0D]/60" />
                  {buildingName}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0C0D0D]">
                Edit Room {room.room_number}
              </h1>
              <p className="text-xs sm:text-sm text-[#0C0D0D]/70 font-medium">
                Update capacity, location floor, and availability status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-white/80 text-[#0C0D0D] border border-[#0C0D0D]/10">
              {isMenBuilding ? "Men's Building" : "Women's Building"}
            </span>
            <Badge variant={room.is_active ? 'success' : 'danger'} className="text-[10px] font-bold">
              {room.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
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
                  <p className="text-xs text-[#0C0D0D]/50">Modify basic properties and limits</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                </div>

                {/* Building (Read-only) */}
                <div>
                  <label className="block text-xs font-bold text-[#0C0D0D] uppercase tracking-wider mb-2">
                    Building
                  </label>
                  <input
                    type="text"
                    value={buildingName}
                    disabled
                    className="w-full px-4 py-3 rounded-2xl border border-[#ECF4EE] bg-[#ECF4EE]/50 text-xs font-semibold text-[#0C0D0D]/60 cursor-not-allowed"
                  />
                  <p className="mt-1.5 text-[10px] font-medium text-[#0C0D0D]/50">Building cannot be changed</p>
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

                {/* Status */}
                <div className="md:col-span-2 pt-2">
                  <label className="block text-xs font-bold text-[#0C0D0D] uppercase tracking-wider mb-2">
                    Status
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-[#ECF4EE] bg-[#ECF4EE]/20 cursor-pointer hover:bg-[#ECF4EE]/40 transition-all flex-1">
                      <input
                        type="radio"
                        value="active"
                        checked={formData.is_active === true}
                        onChange={() => handleChange('is_active', true)}
                        className="h-4 w-4 text-[#0C0D0D] accent-[#0C0D0D] focus:ring-[#0C0D0D]"
                      />
                      <span className="text-xs font-extrabold text-[#0C0D0D]">Active</span>
                    </label>
                    <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-[#ECF4EE] bg-[#ECF4EE]/20 cursor-pointer hover:bg-[#ECF4EE]/40 transition-all flex-1">
                      <input
                        type="radio"
                        value="inactive"
                        checked={formData.is_active === false}
                        onChange={() => handleChange('is_active', false)}
                        className="h-4 w-4 text-[#0C0D0D] accent-[#0C0D0D] focus:ring-[#0C0D0D]"
                      />
                      <span className="text-xs font-extrabold text-[#0C0D0D]">Inactive</span>
                    </label>
                  </div>
                </div>

                {/* Warning Note */}
                <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-extrabold text-amber-900">Important Notes</p>
                      <ul className="text-[11px] font-medium text-amber-800 mt-1 space-y-1 list-disc list-inside">
                        <li>Changing capacity affects available bed numbers immediately.</li>
                        <li>If the room currently has occupants, ensure capacity remains at least the current occupancy count.</li>
                        <li>Current occupancy: <strong className="font-extrabold">{room.current_occupancy}</strong> beds</li>
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
              <h4 className="text-xs font-black uppercase tracking-wider text-[#0C0D0D]/40">Room Summary</h4>
              <div className="space-y-3 text-xs font-semibold text-[#0C0D0D]">
                <div className="flex justify-between">
                  <span className="text-[#0C0D0D]/50">Room</span>
                  <span className="font-extrabold">{formData.room_number || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0C0D0D]/50">Floor</span>
                  <span className="font-extrabold">{formData.floor || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0C0D0D]/50">Building</span>
                  <span className="font-extrabold">{buildingName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0C0D0D]/50">Capacity</span>
                  <span className="font-extrabold">{formData.capacity} beds</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#0C0D0D]/50">Status</span>
                  <Badge variant={formData.is_active ? 'success' : 'danger'} className="text-[10px] font-bold">
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="pt-3 border-t border-[#ECF4EE] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#0C0D0D]/50">Current Occupancy</span>
                    <span className="font-extrabold text-[#0C0D0D]">{room.current_occupancy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#0C0D0D]/50">Available Beds</span>
                    <span className="font-extrabold text-emerald-700">
                      {formData.capacity - room.current_occupancy}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================== ACTION BUTTONS ==================== */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 disabled:opacity-50 rounded-2xl py-3 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#ECF4EE]" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 text-[#ECF4EE]" />
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push(`/dashboard/rooms/${id}`)}
                className="w-full flex items-center justify-center bg-[#ECF4EE] text-[#0C0D0D] hover:bg-[#d2e5d7] rounded-2xl py-3 text-xs font-bold transition-all cursor-pointer"
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