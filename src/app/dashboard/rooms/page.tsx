// src/app/dashboard/rooms/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DoorOpen,
  Plus,
  Search,
  RefreshCw,
  Download,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Loader2,
  Sparkles,
  Power,
  PowerOff,
  EyeOff,
  Eye as EyeIcon
} from 'lucide-react';
import { Badge } from '@/src/components/ui/Badge';
import { useRoom } from '@/src/hooks/useRoom';
import { useBuilding } from '@/src/hooks/useBuilding';
import { toast } from 'sonner';

export default function RoomsPage() {
  const router = useRouter();
  const {
    rooms,
    isLoading,
    error,
    stats,
    fetchRooms,
    deleteRoom,
    refetch,
    clearError,
    toggleRoomStatus,
    isToggling,
  } = useRoom();

  const { buildings, fetchBuildings } = useBuilding();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('all');
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [allFloors, setAllFloors] = useState<number[]>([]);
  const [showInactive, setShowInactive] = useState(false);

  // Fetch buildings and rooms on mount
  useEffect(() => {
    fetchBuildings();
    fetchRooms();
  }, []);

  // Update allFloors whenever rooms change
  useEffect(() => {
    if (rooms.length > 0) {
      const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b);
      setAllFloors(floors);
    }
  }, [rooms]);

  // Handle filter changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedBuilding, selectedFloor, selectedStatus, showInactive]);

  const applyFilters = () => {
    const filters: any = {};
    if (selectedBuilding !== 'all') filters.building_id = selectedBuilding;
    if (selectedFloor !== 'all') filters.floor = parseInt(selectedFloor);
    if (selectedStatus === 'available') filters.is_full = false;
    if (selectedStatus === 'occupied') filters.is_full = true;
    
    if (showInactive) {
      filters.show_inactive = 'true';
    }
    
    fetchRooms(filters);
  };

  // ==================== TOGGLE STATUS HANDLER ====================
  const handleToggleStatus = async (id: string, roomNumber: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    
    if (!confirm(`Are you sure you want to ${action} room "${roomNumber}"?`)) {
      return;
    }

    try {
      await toggleRoomStatus(id, !currentStatus);
      toast.success(`Room ${roomNumber} ${action}d successfully`);
      await refetch();
    } catch (error: any) {
      toast.error(error?.message || `Failed to ${action} room`);
    }
  };

  const handleDelete = async (id: string, roomNumber: string) => {
    if (!confirm(`Are you sure you want to delete room "${roomNumber}"?`)) {
      return;
    }

    setIsDeleting(id);
    try {
      await deleteRoom(id);
      toast.success(`Room ${roomNumber} deleted successfully`);
      await refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete room');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Rooms refreshed');
    } catch {
      toast.error('Failed to refresh rooms');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
  };

  const getFloorDisplay = (floor: number) => {
    if (floor === 0) return 'Ground';
    if (floor === 1) return '1st';
    if (floor === 2) return '2nd';
    if (floor === 3) return '3rd';
    return `${floor}th`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'full':
        return 'bg-[#0C0D0D] text-[#ECF4EE] border-[#0C0D0D]';
      case 'partial':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'empty':
        return 'bg-[#ECF4EE] text-[#0C0D0D] border-[#d2e5d7]';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'full':
        return <CheckCircle className="h-3 w-3 text-[#ECF4EE]" />;
      case 'partial':
        return <AlertCircle className="h-3 w-3 text-amber-600" />;
      case 'empty':
        return <XCircle className="h-3 w-3 text-[#0C0D0D]/60" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'full':
        return 'Full';
      case 'partial':
        return 'Partial';
      case 'empty':
        return 'Empty';
      default:
        return status;
    }
  };

  // Filter rooms by search and show/hide inactive
  const filteredRooms = rooms.filter((room) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      room.room_number.toLowerCase().includes(searchLower) ||
      (room.building_name && room.building_name.toLowerCase().includes(searchLower)) ||
      room.floor_name.toLowerCase().includes(searchLower);
    
    if (!showInactive && !room.is_active) {
      return false;
    }
    
    return matchesSearch;
  });

  const inactiveCount = rooms.filter(r => !r.is_active).length;

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading && rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-3xl bg-[#ECF4EE]/40 border border-[#ECF4EE] text-[#0C0D0D]">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#0C0D0D]/5 blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 text-[#0C0D0D] animate-spin relative z-10" />
        </div>
        <p className="mt-4 text-xs font-bold text-[#0C0D0D]/60 tracking-wider uppercase">
          Loading rooms...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
        <p className="text-rose-700 font-medium">Error loading rooms: {error}</p>
        <button 
          onClick={() => { clearError(); refetch(); }}
          className="mt-4 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 rounded-2xl px-5 py-2.5 text-xs font-bold cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-2 sm:p-4">
      {/* ==================== WELCOME BANNER / HEADER ==================== */}
      <div className="relative overflow-hidden rounded-3xl bg-[#ECF4EE] border border-[#d2e5d7] p-6 sm:p-8 text-[#0C0D0D] shadow-sm">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#0C0D0D]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#0C0D0D] text-[#ECF4EE]">
                <Sparkles className="w-3 h-3 text-[#ECF4EE]" /> Space Management
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0C0D0D]">
              Rooms & Capacity
            </h1>
            <p className="text-xs sm:text-sm text-[#0C0D0D]/70 font-medium">
              Oversee dorm space availability, capacity metrics, and bed allotments across buildings.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/dashboard/rooms/create">
              <button className="flex items-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 transition-all px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs cursor-pointer">
                <Plus className="h-4 w-4" />
                New Room
              </button>
            </Link>
            
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
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Total Rooms</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">{stats?.total || 0}</p>
          <p className="text-xs font-semibold text-[#0C0D0D]/60 mt-1">
            {stats?.by_building_type?.men?.total || 0} Men · {stats?.by_building_type?.women?.total || 0} Women
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Available</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-emerald-600">{stats?.available || 0}</p>
          <div className="w-full bg-[#ECF4EE] rounded-full h-2 mt-2 overflow-hidden">
            <div 
              className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${stats?.total && stats?.available ? (stats.available / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Occupied</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-amber-600">{stats?.occupied || 0}</p>
          <div className="w-full bg-[#ECF4EE] rounded-full h-2 mt-2 overflow-hidden">
            <div 
              className="h-2 rounded-full bg-amber-500 transition-all duration-500"
              style={{ width: `${stats?.total && stats?.occupied ? (stats.occupied / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#ECF4EE] p-6 text-[#0C0D0D] shadow-xs hover:border-[#0C0D0D]/20 transition-all duration-200">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#0C0D0D]/40">Occupancy Rate</p>
          <p className="mt-2 text-3xl font-black tracking-tight text-[#0C0D0D]">
            {stats?.total && stats?.occupied ? Math.round((stats.occupied / stats.total) * 100) : 0}%
          </p>
          <div className="w-full bg-[#ECF4EE] rounded-full h-2 mt-2 overflow-hidden">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                stats?.total && stats?.occupied && (stats.occupied / stats.total) * 100 >= 80 ? 'bg-emerald-500' :
                stats?.total && stats?.occupied && (stats.occupied / stats.total) * 100 >= 50 ? 'bg-amber-500' :
                'bg-rose-500'
              }`}
              style={{ width: `${stats?.total && stats?.occupied ? (stats.occupied / stats.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* ==================== FILTERS & SEARCH ==================== */}
      <div className="bg-white rounded-3xl border border-[#ECF4EE] shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 flex-wrap items-center">
          <div className="flex-1 min-w-[200px] w-full relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0C0D0D]/40" />
            <input
              type="text"
              placeholder="Search by room number, building, or floor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#ECF4EE] focus:border-[#0C0D0D]/30 rounded-2xl text-xs font-medium text-[#0C0D0D] placeholder-[#0C0D0D]/40 focus:outline-none transition-all shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            <select
              value={selectedBuilding}
              onChange={(e) => {
                setSelectedBuilding(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-white border border-[#ECF4EE] rounded-2xl text-xs font-medium text-[#0C0D0D] focus:outline-none focus:border-[#0C0D0D]/30 shadow-2xs cursor-pointer min-w-[150px]"
            >
              <option value="all">🏢 All Buildings</option>
              {buildings.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.type === 'men' ? '👨' : '👩'} {b.name}
                </option>
              ))}
            </select>

            <select
              value={selectedFloor}
              onChange={(e) => {
                setSelectedFloor(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-white border border-[#ECF4EE] rounded-2xl text-xs font-medium text-[#0C0D0D] focus:outline-none focus:border-[#0C0D0D]/30 shadow-2xs cursor-pointer min-w-[130px]"
            >
              <option value="all">📊 All Floors</option>
              {allFloors.map((floor) => (
                <option key={floor} value={floor}>
                  {getFloorDisplay(floor)}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2.5 bg-white border border-[#ECF4EE] rounded-2xl text-xs font-medium text-[#0C0D0D] focus:outline-none focus:border-[#0C0D0D]/30 shadow-2xs cursor-pointer min-w-[130px]"
            >
              <option value="all">🔄 All Status</option>
              <option value="available">✅ Available</option>
              <option value="occupied">❌ Occupied</option>
            </select>

            <div className="flex items-center gap-2 ml-auto">
              {/* ✅ Show Inactive Toggle */}
              <button
                onClick={() => setShowInactive(!showInactive)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                  showInactive
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-white text-[#0C0D0D]/50 border border-[#ECF4EE] hover:border-[#0C0D0D]/20'
                }`}
                title={showInactive ? 'Hide inactive rooms' : 'Show inactive rooms'}
              >
                {showInactive ? (
                  <EyeIcon className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">
                  {showInactive ? 'Showing All' : 'Hide Inactive'}
                </span>
                {inactiveCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                    showInactive ? 'bg-amber-200 text-amber-800' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {inactiveCount}
                  </span>
                )}
              </button>

              <div className="flex border border-[#ECF4EE] bg-white rounded-2xl p-1 shadow-2xs">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                    viewMode === 'grid' 
                      ? 'bg-[#0C0D0D] text-[#ECF4EE]' 
                      : 'text-[#0C0D0D]/50 hover:text-[#0C0D0D]'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-xl text-xs transition-all cursor-pointer ${
                    viewMode === 'list' 
                      ? 'bg-[#0C0D0D] text-[#ECF4EE]' 
                      : 'text-[#0C0D0D]/50 hover:text-[#0C0D0D]'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedBuilding !== 'all' || selectedFloor !== 'all' || selectedStatus !== 'all' || searchQuery || showInactive) && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#ECF4EE]">
            <span className="text-xs font-bold text-[#0C0D0D]/50 uppercase tracking-wider">Active Filters:</span>
            {showInactive && (
              <Badge variant="info" className="flex items-center gap-1.5 bg-amber-50 text-amber-800 border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-xl">
                <EyeIcon className="h-3 w-3" />
                Showing Inactive
                <button onClick={() => setShowInactive(false)} className="hover:text-rose-600 cursor-pointer">
                  <XCircle className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedBuilding !== 'all' && (
              <Badge variant="info" className="flex items-center gap-1.5 bg-[#ECF4EE] text-[#0C0D0D] border-[#d2e5d7] text-[10px] font-bold px-2.5 py-1 rounded-xl">
                🏢 {buildings.find(b => b._id === selectedBuilding)?.name || 'Building'}
                <button onClick={() => setSelectedBuilding('all')} className="hover:text-rose-600 cursor-pointer">
                  <XCircle className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedFloor !== 'all' && (
              <Badge variant="info" className="flex items-center gap-1.5 bg-[#ECF4EE] text-[#0C0D0D] border-[#d2e5d7] text-[10px] font-bold px-2.5 py-1 rounded-xl">
                📊 {getFloorDisplay(parseInt(selectedFloor))}
                <button onClick={() => setSelectedFloor('all')} className="hover:text-rose-600 cursor-pointer">
                  <XCircle className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedStatus !== 'all' && (
              <Badge variant="info" className="flex items-center gap-1.5 bg-[#ECF4EE] text-[#0C0D0D] border-[#d2e5d7] text-[10px] font-bold px-2.5 py-1 rounded-xl">
                {selectedStatus === 'available' ? '✅ Available' : '❌ Occupied'}
                <button onClick={() => setSelectedStatus('all')} className="hover:text-rose-600 cursor-pointer">
                  <XCircle className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="info" className="flex items-center gap-1.5 bg-[#ECF4EE] text-[#0C0D0D] border-[#d2e5d7] text-[10px] font-bold px-2.5 py-1 rounded-xl">
                🔍 {searchQuery}
                <button onClick={() => setSearchQuery('')} className="hover:text-rose-600 cursor-pointer">
                  <XCircle className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <button
              onClick={() => {
                setSelectedBuilding('all');
                setSelectedFloor('all');
                setSelectedStatus('all');
                setSearchQuery('');
                setShowInactive(false);
                setCurrentPage(1);
                fetchRooms({});
              }}
              className="text-xs font-bold text-[#0C0D0D] hover:underline ml-1 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results count */}
        <div className="text-xs font-medium text-[#0C0D0D]/50 pt-1">
          Found <span className="font-bold text-[#0C0D0D]">{filteredRooms.length}</span> rooms
          {selectedBuilding !== 'all' && ` in ${buildings.find(b => b._id === selectedBuilding)?.name || ''}`}
          {selectedFloor !== 'all' && ` on ${getFloorDisplay(parseInt(selectedFloor))}`}
          {selectedStatus !== 'all' && ` that are ${selectedStatus}`}
          {searchQuery && ` matching "${searchQuery}"`}
          {showInactive && ` (including ${inactiveCount} inactive)`}
        </div>
      </div>

      {/* ==================== ROOMS DISPLAY ==================== */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {paginatedRooms.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-[#ECF4EE] p-8">
              <DoorOpen className="h-12 w-12 text-[#0C0D0D]/20 mx-auto mb-3" />
              <p className="text-base font-extrabold text-[#0C0D0D]">No rooms found</p>
              <p className="text-xs text-[#0C0D0D]/50 font-medium mt-1">
                {searchQuery || selectedBuilding !== 'all' || selectedFloor !== 'all' || selectedStatus !== 'all' || showInactive
                  ? 'Try adjusting your filters'
                  : 'Create your first room record'}
              </p>
              <button
                onClick={() => {
                  setSelectedBuilding('all');
                  setSelectedFloor('all');
                  setSelectedStatus('all');
                  setSearchQuery('');
                  setShowInactive(false);
                  setCurrentPage(1);
                  fetchRooms({});
                }}
                className="mt-4 inline-flex items-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 transition-all px-4 py-2.5 rounded-2xl text-xs font-bold cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            paginatedRooms.map((room) => (
              <div
                key={room._id}
                className={`bg-white rounded-3xl border shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer ${
                  room.is_active 
                    ? 'border-[#ECF4EE] hover:border-[#0C0D0D]/20' 
                    : 'border-gray-200 hover:border-gray-300 opacity-75'
                }`}
                onClick={() => router.push(`/dashboard/rooms/${room._id}`)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl ${
                          room.is_active ? 'bg-[#ECF4EE] text-[#0C0D0D]' : 'bg-gray-100 text-gray-400'
                        }`}>
                          <DoorOpen className="h-4 w-4" />
                        </div>
                        <h3 className={`font-extrabold text-base group-hover:text-emerald-700 transition-colors ${
                          room.is_active ? 'text-[#0C0D0D]' : 'text-gray-400'
                        }`}>
                          Room {room.room_number}
                        </h3>
                      </div>
                      <p className="text-xs font-medium text-[#0C0D0D]/50 mt-2">
                        {room.floor_name} · {room.building_name || 'Building'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="info" className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                        room.is_active ? getStatusBadge(room.check_in_status) : 'bg-gray-100 text-gray-400 border-gray-200'
                      }`}>
                        <span className="flex items-center gap-1">
                          {room.is_active ? getStatusIcon(room.check_in_status) : <XCircle className="h-3 w-3 text-gray-400" />}
                          {room.is_active ? getStatusLabel(room.check_in_status) : 'Inactive'}
                        </span>
                      </Badge>
                      <Badge variant="info" className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${
                        room.is_active 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>
                        {room.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className={`${
                      room.is_active ? 'bg-[#ECF4EE]/50 border-[#ECF4EE]' : 'bg-gray-50 border-gray-200'
                    } border rounded-2xl p-2.5 text-center`}>
                      <p className={`text-base font-black ${room.is_active ? 'text-[#0C0D0D]' : 'text-gray-400'}`}>
                        {room.capacity}
                      </p>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${
                        room.is_active ? 'text-[#0C0D0D]/50' : 'text-gray-400'
                      }`}>
                        Capacity
                      </p>
                    </div>
                    <div className={`${
                      room.is_active ? 'bg-[#ECF4EE]/50 border-[#ECF4EE]' : 'bg-gray-50 border-gray-200'
                    } border rounded-2xl p-2.5 text-center`}>
                      <p className={`text-base font-black ${room.current_occupancy > 0 ? 'text-emerald-700' : room.is_active ? 'text-[#0C0D0D]/40' : 'text-gray-400'}`}>
                        {room.current_occupancy}
                      </p>
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${
                        room.is_active ? 'text-[#0C0D0D]/50' : 'text-gray-400'
                      }`}>
                        Occupied
                      </p>
                    </div>
                  </div>

                  {room.is_active && (
                    <div className="mt-3.5 w-full bg-[#ECF4EE] rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          room.check_in_status === 'full' ? 'bg-[#0C0D0D]' :
                          room.check_in_status === 'partial' ? 'bg-amber-500' :
                          'bg-emerald-500'
                        }`}
                        style={{ width: `${(room.current_occupancy / room.capacity) * 100}%` }}
                      />
                    </div>
                  )}

                  <div className={`mt-4 pt-3 border-t flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                    room.is_active ? 'border-[#ECF4EE]' : 'border-gray-200'
                  }`}>
                    {/* Toggle Status Button */}
                    <button
                      className={`p-1.5 rounded-xl transition-colors ${
                        room.is_active 
                          ? 'hover:bg-amber-50 text-emerald-600 hover:text-amber-600' 
                          : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-600'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(room._id, room.room_number, room.is_active);
                      }}
                      title={room.is_active ? 'Deactivate Room' : 'Activate Room'}
                      disabled={isToggling}
                    >
                      {isToggling ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : room.is_active ? (
                        <Power className="h-4 w-4" />
                      ) : (
                        <PowerOff className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/rooms/${room._id}`);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/rooms/${room._id}/edit`);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      className="p-1.5 rounded-xl hover:bg-rose-50 text-[#0C0D0D]/60 hover:text-rose-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(room._id, room.room_number);
                      }}
                      disabled={isDeleting === room._id}
                    >
                      {isDeleting === room._id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-3xl border border-[#ECF4EE] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#ECF4EE] bg-[#ECF4EE]/40 text-[#0C0D0D]/60">
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Room</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Floor</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Building</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Capacity</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Occupancy</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Active</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-black uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECF4EE]">
                {paginatedRooms.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-xs font-semibold text-[#0C0D0D]/50">
                      No rooms found matching your criteria
                    </td>
                  </tr>
                ) : (
                  paginatedRooms.map((room) => (
                    <tr key={room._id} className={`hover:bg-[#ECF4EE]/20 transition-colors ${!room.is_active ? 'opacity-60' : ''}`}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${room.is_active ? 'bg-[#ECF4EE] text-[#0C0D0D]' : 'bg-gray-100 text-gray-400'}`}>
                            <DoorOpen className="h-4 w-4" />
                          </div>
                          <span className={`font-extrabold text-sm ${room.is_active ? 'text-[#0C0D0D]' : 'text-gray-400'}`}>
                            {room.room_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium ${room.is_active ? 'text-[#0C0D0D]/70' : 'text-gray-400'}`}>
                          {room.floor_name}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium ${room.is_active ? 'text-[#0C0D0D]/70' : 'text-gray-400'}`}>
                          {room.building_name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-extrabold ${room.is_active ? 'text-[#0C0D0D]' : 'text-gray-400'}`}>
                          {room.capacity} beds
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-extrabold ${room.current_occupancy > 0 ? 'text-emerald-700' : room.is_active ? 'text-[#0C0D0D]/40' : 'text-gray-400'}`}>
                            {room.current_occupancy}/{room.capacity}
                          </span>
                          {room.is_active && (
                            <div className="w-16 bg-[#ECF4EE] rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-1.5 rounded-full ${
                                  room.check_in_status === 'full' ? 'bg-[#0C0D0D]' :
                                  room.check_in_status === 'partial' ? 'bg-amber-500' :
                                  'bg-emerald-500'
                                }`}
                                style={{ width: `${(room.current_occupancy / room.capacity) * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="info" className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                          room.is_active ? getStatusBadge(room.check_in_status) : 'bg-gray-100 text-gray-400 border-gray-200'
                        }`}>
                          <span className="flex items-center gap-1">
                            {room.is_active ? getStatusIcon(room.check_in_status) : <XCircle className="h-3 w-3 text-gray-400" />}
                            {room.is_active ? getStatusLabel(room.check_in_status) : 'Inactive'}
                          </span>
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="info" className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${
                          room.is_active 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {room.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            className={`p-1.5 rounded-xl transition-colors ${
                              room.is_active 
                                ? 'hover:bg-amber-50 text-emerald-600 hover:text-amber-600' 
                                : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-600'
                            }`}
                            onClick={() => handleToggleStatus(room._id, room.room_number, room.is_active)}
                            title={room.is_active ? 'Deactivate Room' : 'Activate Room'}
                            disabled={isToggling}
                          >
                            {isToggling ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : room.is_active ? (
                              <Power className="h-4 w-4" />
                            ) : (
                              <PowerOff className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors"
                            onClick={() => router.push(`/dashboard/rooms/${room._id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors"
                            onClick={() => router.push(`/dashboard/rooms/${room._id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="p-1.5 rounded-xl hover:bg-rose-50 text-[#0C0D0D]/60 hover:text-rose-600 transition-colors"
                            onClick={() => handleDelete(room._id, room.room_number)}
                            disabled={isDeleting === room._id}
                          >
                            {isDeleting === room._id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== PAGINATION ==================== */}
      {filteredRooms.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold text-[#0C0D0D]/60">
              Showing <span className="font-bold text-[#0C0D0D]">
                {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredRooms.length)}
              </span> of <span className="font-bold text-[#0C0D0D]">{filteredRooms.length}</span> rooms
            </p>
            <select
              value={itemsPerPage}
              onChange={(e) => handleLimitChange(parseInt(e.target.value))}
              className="px-2.5 py-1 bg-white border border-[#ECF4EE] rounded-xl text-xs font-bold text-[#0C0D0D] focus:outline-none shadow-2xs cursor-pointer"
            >
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="flex items-center gap-1 px-3 py-2 bg-white border border-[#ECF4EE] rounded-xl text-xs font-bold text-[#0C0D0D] disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs hover:border-[#0C0D0D]/20 transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-[#0C0D0D] text-[#ECF4EE]'
                        : 'text-[#0C0D0D]/70 hover:bg-[#ECF4EE]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="flex items-center gap-1 px-3 py-2 bg-white border border-[#ECF4EE] rounded-xl text-xs font-bold text-[#0C0D0D] disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs hover:border-[#0C0D0D]/20 transition-all cursor-pointer"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}