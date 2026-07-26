// src/app/dashboard/rooms/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  DoorOpen,
  Edit,
  Trash2,
  Bed,
  Users,
  UserX,
  Building2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  UserCog,
  Home,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Badge } from '@/src/components/ui/Badge';
import { Avatar } from '@/src/components/ui/Avatar';
import { useRoom } from '@/src/hooks/useRoom';
import { toast } from 'sonner';

interface RoomDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function RoomDetailPage({ params }: RoomDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const {
    selectedRoom: room,
    isLoading,
    error,
    fetchRoom,
    deleteRoom,
    clearSelected,
    clearError,
    refetch,
  } = useRoom();

  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchRoom(id);
    return () => {
      clearSelected();
    };
  }, [id]);

  const handleDelete = async () => {
    if (!room) return;
    if (!confirm(`Are you sure you want to delete room "${room.room_number}"? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteRoom(room._id);
      toast.success(`Room ${room.room_number} deleted successfully`);
      router.push('/dashboard/rooms');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete room');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefresh = async () => {
    await refetch();
    toast.success('Room data refreshed');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'full':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="h-3 w-3 text-emerald-600" />
            Full
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="h-3 w-3 text-amber-600" />
            Partial
          </span>
        );
      case 'empty':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="h-3 w-3 text-rose-600" />
            Empty
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-[#0C0D0D] border border-gray-200">
            {status}
          </span>
        );
    }
  };

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

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
        <p className="text-rose-700 font-medium">Error loading room: {error}</p>
        <button 
          onClick={() => { clearError(); fetchRoom(id); }}
          className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold cursor-pointer transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="bg-white rounded-3xl border border-[#ECF4EE] p-12 text-center max-w-md mx-auto my-12 shadow-xs">
        <DoorOpen className="h-12 w-12 text-[#0C0D0D]/30 mx-auto mb-4" />
        <h3 className="text-base font-extrabold text-[#0C0D0D]">Room Not Found</h3>
        <p className="text-xs text-[#0C0D0D]/50 mt-1 mb-6">The room you are looking for does not exist or has been removed.</p>
        <Link href="/dashboard/rooms">
          <button className="bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold cursor-pointer transition-all">
            Back to Rooms
          </button>
        </Link>
      </div>
    );
  }

  const occupancyRate = room.capacity > 0 
    ? Math.round((room.current_occupancy / room.capacity) * 100) 
    : 0;

  const buildingName = room.building_name || 'Unknown';
  const buildingType = room.building_type || 'unknown';
  const isMenBuilding = buildingType === 'men';



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
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#0C0D0D] text-[#ECF4EE]">
                  <Sparkles className="w-3 h-3 text-[#ECF4EE]" /> Room Details
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/80 text-[#0C0D0D] border border-[#0C0D0D]/10">
                  <Building2 className="h-3 w-3 text-[#0C0D0D]/60" />
                  {buildingName}
                </span>
                {getStatusBadge(room.check_in_status)}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0C0D0D]">
                Room {room.room_number}
              </h1>
              <p className="text-xs sm:text-sm text-[#0C0D0D]/70 font-medium">
                {isMenBuilding ? "Men's Building" : "Women's Building"} · {room.floor_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link href={`/dashboard/rooms/${room._id}/edit`}>
              <button className="flex items-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 transition-all px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs cursor-pointer">
                <Edit className="h-4 w-4 text-[#ECF4EE]" />
                Edit Room
              </button>
            </Link>

            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 bg-rose-600 text-white hover:bg-rose-700 transition-all px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete
            </button>

            <button 
              onClick={handleRefresh}
              className="p-2.5 bg-white/80 hover:bg-white text-[#0C0D0D] border border-[#0C0D0D]/10 rounded-2xl transition-all shadow-2xs cursor-pointer"
            >
              <RefreshCw className="h-4 w-4 text-[#0C0D0D]/60" />
            </button>
          </div>
        </div>
      </div>

      {/* ==================== STATS CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Room Number</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{room.room_number}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#ECF4EE] flex items-center justify-center text-[#0C0D0D]">
              <DoorOpen className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs font-medium text-[#0C0D0D]/60 pt-3 border-t border-[#ECF4EE]">
            Active Unit
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Total Capacity</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{room.capacity}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#ECF4EE] flex items-center justify-center text-[#0C0D0D]">
              <Bed className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs font-bold text-emerald-700 pt-3 border-t border-[#ECF4EE]">
            {room.capacity - room.current_occupancy} beds available
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Occupied Beds</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{room.current_occupancy}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#ECF4EE] flex items-center justify-center text-[#0C0D0D]">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs font-bold text-[#0C0D0D]/70 pt-3 border-t border-[#ECF4EE]">
            {occupancyRate}% occupancy rate
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Floor Level</p>
              <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{room.floor_name}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#ECF4EE] flex items-center justify-center text-[#0C0D0D]">
              <Home className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-3 text-xs font-medium text-[#0C0D0D]/60 pt-3 border-t border-[#ECF4EE] truncate">
            Building: {buildingName}
          </p>
        </div>
      </div>

      {/* ==================== MAIN CONTENT & SIDEBAR ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs space-y-6">
            <h3 className="font-extrabold text-[#0C0D0D] text-base">Room Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#ECF4EE]/40 border border-[#ECF4EE] rounded-2xl p-4">
                <p className="text-[10px] font-black text-[#0C0D0D]/50 uppercase tracking-wider mb-3">Room Specifications</p>
                <dl className="space-y-2.5 text-xs font-semibold text-[#0C0D0D]">
                  <div className="flex justify-between">
                    <dt className="text-[#0C0D0D]/50">Room Number</dt>
                    <dd className="font-extrabold">{room.room_number}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#0C0D0D]/50">Floor</dt>
                    <dd className="font-extrabold">{room.floor_name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#0C0D0D]/50">Building</dt>
                    <dd className="font-extrabold">{buildingName}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#0C0D0D]/50">Building Type</dt>
                    <dd className="font-extrabold capitalize">{buildingType}</dd>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-[#ECF4EE]">
                    <dt className="text-[#0C0D0D]/50">Status</dt>
                    <dd>
                      <Badge variant={room.is_active ? 'success' : 'danger'} className="text-[10px] font-bold">
                        {room.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="bg-[#ECF4EE]/40 border border-[#ECF4EE] rounded-2xl p-4">
                <p className="text-[10px] font-black text-[#0C0D0D]/50 uppercase tracking-wider mb-3">Capacity & Status</p>
                <dl className="space-y-2.5 text-xs font-semibold text-[#0C0D0D]">
                  <div className="flex justify-between">
                    <dt className="text-[#0C0D0D]/50">Total Beds</dt>
                    <dd className="font-extrabold">{room.capacity}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#0C0D0D]/50">Occupied</dt>
                    <dd className="font-extrabold text-amber-700">{room.current_occupancy}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#0C0D0D]/50">Available</dt>
                    <dd className="font-extrabold text-emerald-700">{room.capacity - room.current_occupancy}</dd>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-[#ECF4EE]">
                    <dt className="text-[#0C0D0D]/50">Occupancy Level</dt>
                    <dd>{getStatusBadge(room.check_in_status)}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-[#ECF4EE]/40 border border-[#ECF4EE] rounded-2xl p-4 md:col-span-2">
                <p className="text-[10px] font-black text-[#0C0D0D]/50 uppercase tracking-wider mb-3">Bed Allocation Map</p>
                <div className="flex flex-wrap gap-2">
                  {room.bed_numbers?.map((bed: number) => {
                    const isOccupied = room.occupants?.some((o: any) => o.dorm_cache?.bedNumber === bed);
                    return (
                      <div
                        key={bed}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                          isOccupied 
                            ? 'bg-[#0C0D0D] border-[#0C0D0D] text-[#ECF4EE]' 
                            : 'bg-white border-[#ECF4EE] text-[#0C0D0D]'
                        }`}
                      >
                        Bed {bed} {isOccupied ? '• Occupied' : '• Empty'}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Assignments Log */}
          {room.assignments && room.assignments.length > 0 && (
            <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs space-y-4">
              <h3 className="font-extrabold text-[#0C0D0D] text-base flex items-center gap-2">
                <UserCog className="h-5 w-5 text-[#0C0D0D]" />
                Assignment Log
              </h3>
              <div className="space-y-3">
                {room.assignments.map((assignment: any) => (
                  <div
                    key={assignment._id}
                    className="flex items-center justify-between p-4 bg-[#ECF4EE]/40 border border-[#ECF4EE] rounded-2xl"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-[#0C0D0D]">
                        {assignment.attendee_id?.first_name} {assignment.attendee_id?.last_name}
                      </p>
                      <p className="text-[11px] font-medium text-[#0C0D0D]/60 mt-0.5">
                        ID: {assignment.attendee_id?.unique_id} · Bed {assignment.bed_number}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="success" className="text-[10px] font-bold">
                        {assignment.status}
                      </Badge>
                      <p className="text-[10px] font-medium text-[#0C0D0D]/40 mt-1">
                        Assigned by {assignment.assigned_by?.name || 'System'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Occupants & Actions Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-[#0C0D0D] text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-[#0C0D0D]" />
                Current Occupants
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#ECF4EE] text-[#0C0D0D]">
                {room.current_occupancy}/{room.capacity}
              </span>
            </div>

            {room.occupants && room.occupants.length > 0 ? (
              <div className="space-y-3">
                {room.occupants.map((occupant: any, index: number) => (
                  <div
                    key={occupant._id || index}
                    className="flex items-center gap-3 p-3.5 bg-[#ECF4EE]/40 border border-[#ECF4EE] hover:bg-[#ECF4EE] rounded-2xl transition-all cursor-pointer group"
                    onClick={() => router.push(`/dashboard/attendees/${occupant._id}`)}
                  >
                    <Avatar
                      name={occupant.full_name || `${occupant.first_name} ${occupant.last_name}`}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-extrabold text-[#0C0D0D] truncate group-hover:text-emerald-800 transition-colors">
                        {occupant.full_name || `${occupant.first_name} ${occupant.last_name}`}
                      </p>
                      <p className="text-[10px] font-medium text-[#0C0D0D]/50 truncate">
                        {occupant.unique_id || 'N/A'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#0C0D0D] text-[#ECF4EE]">
                      Bed {occupant.dorm_cache?.bedNumber || index + 1}
                    </span>
                    <ArrowRight className="h-4 w-4 text-[#0C0D0D]/30 group-hover:text-[#0C0D0D] transition-colors" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-[#ECF4EE]/20 border border-dashed border-[#ECF4EE] rounded-2xl">
                <UserX className="h-10 w-10 text-[#0C0D0D]/30 mx-auto mb-2" />
                <p className="text-xs font-bold text-[#0C0D0D]">No occupants assigned</p>
                <p className="text-[10px] text-[#0C0D0D]/50 mt-0.5">This room is currently empty</p>
              </div>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 shadow-xs space-y-3">
            <h3 className="font-extrabold text-[#0C0D0D] text-sm">Quick Actions</h3>
            <div className="space-y-2">
              <Link href={`/dashboard/rooms/${room._id}/edit`} className="block">
                <button className="w-full flex items-center justify-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl py-2.5 text-xs font-bold transition-all cursor-pointer">
                  <Edit className="h-4 w-4" />
                  Edit Room Settings
                </button>
              </Link>
              <button
                onClick={() => router.push(`/dashboard/dorm`)}
                className="w-full flex items-center justify-center gap-2 bg-[#ECF4EE] text-[#0C0D0D] hover:bg-[#d2e5d7] rounded-2xl py-2.5 text-xs font-bold transition-all cursor-pointer"
              >
                <Users className="h-4 w-4" />
                Manage Dorm Assignments
              </button>
            </div>
          </div>

          {/* System Info Card */}
          <div className="bg-[#0C0D0D] text-[#ECF4EE] rounded-3xl p-5 shadow-xs space-y-2 text-xs">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#ECF4EE]/50 mb-3">System Identifiers</p>
            <div className="flex justify-between">
              <span className="text-[#ECF4EE]/60">Room ID</span>
              <span className="font-mono text-[11px] text-[#ECF4EE]/90">{room.room_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#ECF4EE]/60">Building ID</span>
              <span className="font-mono text-[11px] text-[#ECF4EE]/90">{room.building_id}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-white/10 text-[11px]">
              <span className="text-[#ECF4EE]/60">Created</span>
              <span>{new Date(room.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}