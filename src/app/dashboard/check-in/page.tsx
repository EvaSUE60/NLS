// src/app/dashboard/check-in/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Phone,
  MapPin,
  Building2,
  Bed,
  DoorOpen,
  Loader2,
  QrCode,
  Scan,
  History,
  Sparkles,
  Zap,
  CheckSquare,
  FileSpreadsheet,
  AlertCircle,
  UserX,
  Filter
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Avatar } from '@/src/components/ui/Avatar';
import { useCheckin } from '@/src/hooks/useCheckin';
import { useAttendeeStore } from '@/src/store/attendee.store';
import { toast } from 'sonner';

const regions = [
  'All Regions',
  'Central 1',
  'Central 2',
  'North',
  'North East',
  'North West',
  'South 1',
  'South 2',
  'South West',
  'West'
];

const genders = ['All Genders', 'Male', 'Female'];

export default function CheckInPage() {
  const {
    searchResults,
    selectedAttendee,
    isLoading,
    error,
    stats,
    isCheckingIn,
    searchByNLS,
    checkInArrival,
    fetchStats,
    clearError,
    clearSelected,
    selectAttendee,
  } = useCheckin();

  const { isLoading: attendeesLoading, fetchAttendees } = useAttendeeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All Regions');
  const [selectedGender, setSelectedGender] = useState('All Genders');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'checked-in' | 'pending'>('all');

  useEffect(() => {
    fetchStats();
    fetchAttendees({ limit: 100 });
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchStats();
      await fetchAttendees({ limit: 100 });
      toast.success('Live event metrics updated!');
    } catch {
      toast.error('Failed to sync metrics');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    toast.success('Preparing CSV manifest for export...');
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      clearSelected();
      return;
    }
    
    setIsSearching(true);
    try {
      await searchByNLS(query.trim());
      if (searchResults.length === 0) {
        toast.info('No attendee record found matching that search.');
      }
    } catch {
      toast.error('Search operation failed.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCheckIn = async (attendeeId: string) => {
    try {
      await checkInArrival(attendeeId, 'manual');
      toast.success('⚡ Express check-in complete!');
      setSearchQuery('');
      clearSelected();
      await fetchStats();
      await fetchAttendees({ limit: 100 });
    } catch (err: any) {
      toast.error(err?.message || 'Check-in failed');
    }
  };

  const handleView = (attendee: any) => {
    selectAttendee(attendee);
    setViewModalOpen(true);
  };

  // Metrics calculation
  const total = stats?.summary?.total_attendees || 0;
  const checkedIn = stats?.summary?.arrived || 0;
  const notCheckedIn = Math.max(0, total - checkedIn);
  const arrivalRate = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  const recentCheckIns = stats?.recent_check_ins || [];

  const displayList = searchQuery.trim() 
    ? searchResults 
    : recentCheckIns;

  const filteredList = displayList.filter((c: any) => {
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
    const matchesSearch = searchQuery.trim() === '' || 
      fullName.includes(searchQuery.toLowerCase()) ||
      c.unique_id?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRegion = selectedRegion === 'All Regions' || c.region === selectedRegion;
    const matchesGender = selectedGender === 'All Genders' || c.gender === selectedGender;
    
    let matchesViewMode = true;
    if (viewMode === 'checked-in') {
      matchesViewMode = c.arrived === true || c.arrival_time !== null;
    } else if (viewMode === 'pending') {
      matchesViewMode = c.arrived !== true && c.arrival_time === null;
    }
    
    return matchesSearch && matchesRegion && matchesGender && matchesViewMode;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const isLoadingState = isLoading || attendeesLoading;

  if (isLoadingState && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4 bg-[#FAFAFA]">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-[#ECF4EE] border-t-[#0C0D0D] animate-spin" />
          <Sparkles className="w-6 h-6 text-[#0C0D0D] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <p className="text-[#0C0D0D]/70 font-semibold text-sm tracking-wide">Syncing Check-In Terminal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-xl border border-red-200/80 rounded-3xl p-8 text-center max-w-lg mx-auto my-12 shadow-xl">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-[#0C0D0D] mb-1">Check-in Feed Interrupted</h3>
        <p className="text-sm text-[#0C0D0D]/60 mb-6">{error}</p>
        <Button variant="primary" className="bg-[#0C0D0D] hover:bg-[#0C0D0D]/90 text-white rounded-xl font-bold" onClick={() => { clearError(); fetchStats(); }}>
          Reconnect Terminal
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 bg-[#FAFAFA] min-h-screen p-2 sm:p-6">
      {/* ==================== GLASS HERO HEADER ==================== */}
      <div className="relative overflow-hidden bg-[#0C0D0D] rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-white/10">
        {/* Glowing Mint Ambient Orbs */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-[#ECF4EE]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-12 w-60 h-60 bg-[#ECF4EE]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECF4EE]/15 border border-[#ECF4EE]/20 text-[#ECF4EE] text-xs font-semibold backdrop-blur-md">
              <Zap className="w-3.5 h-3.5 text-[#ECF4EE] fill-[#ECF4EE]" /> Live Reception Hub
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Express Check-In
            </h1>
            <p className="text-[#ECF4EE]/80 text-sm max-w-xl">
              Seamlessly search attendees, scan QR passes in real time, and monitor live arrival capacity.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowScanner(true)}
              className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-[#ECF4EE] hover:bg-[#ECF4EE]/90 text-[#0C0D0D] font-bold shadow-lg shadow-[#ECF4EE]/10 active:scale-95 transition-all text-sm"
            >
              <Scan className="h-4 w-4 stroke-[2.5]" />
              Scan QR Badge
            </button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleExport}
              className="bg-white/10 hover:bg-white/20 text-white border-white/10 backdrop-blur-md rounded-2xl h-11 px-4"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-white/10 hover:bg-white/20 text-white border-white/10 backdrop-blur-md rounded-2xl h-11 px-4"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>
        </div>
      </div>

      {/* ==================== GLASS METRIC CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="relative overflow-hidden bg-white/70 backdrop-blur-md rounded-3xl p-5 border border-white shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0C0D0D]/50">Total Registered</p>
              <p className="mt-2 text-3xl font-black text-[#0C0D0D]">{total}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#ECF4EE] flex items-center justify-center text-[#0C0D0D] group-hover:scale-110 transition-transform shadow-xs">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-[#0C0D0D]/60 font-semibold border-t border-[#0C0D0D]/5 pt-3">
            <span>{checkedIn} Checked-in</span>
            <span className="text-[#0C0D0D]/20">•</span>
            <span>{notCheckedIn} Awaiting</span>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white/70 backdrop-blur-md rounded-3xl p-5 border border-white shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0C0D0D]/50">Checked In</p>
              <p className="mt-2 text-3xl font-black text-[#0C0D0D]">{checkedIn}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#0C0D0D] flex items-center justify-center text-[#ECF4EE] group-hover:scale-110 transition-transform shadow-xs">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs border-t border-[#0C0D0D]/5 pt-3">
            <span className="text-[#0C0D0D] font-bold">{arrivalRate}% Completion</span>
            <div className="w-20 bg-[#ECF4EE] h-2 rounded-full overflow-hidden p-0.5 border border-[#0C0D0D]/10">
              <div className="bg-[#0C0D0D] h-full rounded-full transition-all duration-500" style={{ width: `${arrivalRate}%` }} />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white/70 backdrop-blur-md rounded-3xl p-5 border border-white shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0C0D0D]/50">Remaining</p>
              <p className="mt-2 text-3xl font-black text-[#0C0D0D]/80">{notCheckedIn}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#ECF4EE] flex items-center justify-center text-[#0C0D0D] group-hover:scale-110 transition-transform shadow-xs">
              <Clock className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-[#0C0D0D]/60 border-t border-[#0C0D0D]/5 pt-3 font-semibold">
            <span>{100 - arrivalRate}% of total capacity</span>
          </div>
        </div>

        <div className="relative overflow-hidden bg-white/70 backdrop-blur-md rounded-3xl p-5 border border-white shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0C0D0D]/50">Regions Active</p>
              <p className="mt-2 text-3xl font-black text-[#0C0D0D]">{stats?.by_region?.length || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-[#ECF4EE] flex items-center justify-center text-[#0C0D0D] group-hover:scale-110 transition-transform shadow-xs">
              <MapPin className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-[#0C0D0D]/60 border-t border-[#0C0D0D]/5 pt-3 font-semibold">
            <span>Delegations represented</span>
          </div>
        </div>
      </div>

      {/* ==================== VIEW MODE TAB CAPSULES ==================== */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold uppercase tracking-wider text-[#0C0D0D]/50 mr-2">Filter View:</span>
        <button
          onClick={() => setViewMode('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all backdrop-blur-md ${
            viewMode === 'all' 
              ? 'bg-[#0C0D0D] text-white shadow-md' 
              : 'bg-white/60 text-[#0C0D0D]/70 hover:bg-white border border-white'
          }`}
        >
          All Registrants
        </button>
        <button
          onClick={() => setViewMode('checked-in')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all backdrop-blur-md ${
            viewMode === 'checked-in' 
              ? 'bg-[#0C0D0D] text-[#ECF4EE] shadow-md' 
              : 'bg-white/60 text-[#0C0D0D]/70 hover:bg-white border border-white'
          }`}
        >
          ✅ Checked In
        </button>
        <button
          onClick={() => setViewMode('pending')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all backdrop-blur-md ${
            viewMode === 'pending' 
              ? 'bg-[#0C0D0D] text-white shadow-md' 
              : 'bg-white/60 text-[#0C0D0D]/70 hover:bg-white border border-white'
          }`}
        >
          ⏳ Pending Arrival
        </button>
      </div>

      {/* ==================== ACTION & LOOKUP CONTROLS ==================== */}
      <div className="bg-white/70 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-white shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Quick Lookup Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0C0D0D]/40" />
            <input
              type="text"
              placeholder="Search by full name or Unique NLS ID (e.g. NLS-892)..."
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (val.length >= 3) handleSearch(val);
                else if (!val) clearSelected();
              }}
              className="w-full pl-11 pr-10 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-sm font-semibold text-[#0C0D0D] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] transition-all placeholder:text-[#0C0D0D]/40 shadow-inner"
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0C0D0D] animate-spin" />
            )}
          </div>

          {/* Region and Gender Selectors */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-xs font-bold text-[#0C0D0D] focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] shadow-inner"
            >
              {regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>

            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="px-4 py-3 bg-[#FAFAFA] border border-[#0C0D0D]/10 rounded-2xl text-xs font-bold text-[#0C0D0D] focus:outline-none focus:ring-2 focus:ring-[#0C0D0D] shadow-inner"
            >
              {genders.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        </div>

        {/* Active Filter Badges */}
        {(selectedRegion !== 'All Regions' || selectedGender !== 'All Genders' || viewMode !== 'all') && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#0C0D0D]/5">
            <span className="text-xs text-[#0C0D0D]/50 font-semibold">Active filters:</span>
            {selectedRegion !== 'All Regions' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#ECF4EE] text-[#0C0D0D] text-xs font-bold border border-[#0C0D0D]/10">
                {selectedRegion}
                <button onClick={() => setSelectedRegion('All Regions')} className="hover:text-red-600">
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
            {selectedGender !== 'All Genders' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#ECF4EE] text-[#0C0D0D] text-xs font-bold border border-[#0C0D0D]/10">
                {selectedGender}
                <button onClick={() => setSelectedGender('All Genders')} className="hover:text-red-600">
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
            {viewMode !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#ECF4EE] text-[#0C0D0D] text-xs font-bold border border-[#0C0D0D]/10">
                {viewMode === 'checked-in' ? '✅ Checked In' : '⏳ Pending'}
                <button onClick={() => setViewMode('all')} className="hover:text-red-600">
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSelectedRegion('All Regions');
                setSelectedGender('All Genders');
                setViewMode('all');
                setSearchQuery('');
              }}
              className="text-xs text-[#0C0D0D] underline font-bold hover:opacity-75 ml-2"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* ==================== ATTENDEE DATA TABLE ==================== */}
      <Card className="rounded-3xl border-white bg-white/70 backdrop-blur-md shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#0C0D0D]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#ECF4EE]/30">
          <div>
            <h3 className="font-extrabold text-[#0C0D0D] flex items-center gap-2">
              <History className="w-4 h-4 text-[#0C0D0D]" />
              {searchQuery.trim() ? 'Search Results' : 'Recent Check-In Activity'}
            </h3>
            <p className="text-xs text-[#0C0D0D]/60 font-medium">
              {searchQuery.trim() 
                ? `Showing matches for "${searchQuery}" (${filteredList.length} found)`
                : `Displaying ${filteredList.length} live records`}
            </p>
          </div>
          {filteredList.length > 0 && (
            <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-[#0C0D0D] text-[#ECF4EE] text-xs font-bold shadow-xs">
              {filteredList.length} Records
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#0C0D0D]">
            <thead className="bg-[#FAFAFA] text-[#0C0D0D]/50 font-bold text-xs uppercase tracking-wider border-b border-[#0C0D0D]/5">
              <tr>
                <th className="px-5 py-4">Attendee</th>
                <th className="px-5 py-4">Region</th>
                <th className="px-5 py-4">Check-in Time</th>
                <th className="px-5 py-4">Method</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0C0D0D]/5 font-medium">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#ECF4EE] flex items-center justify-center mx-auto text-[#0C0D0D]">
                        <UserX className="w-6 h-6" />
                      </div>
                      <p className="text-[#0C0D0D] font-bold">No Attendees Found</p>
                      <p className="text-xs text-[#0C0D0D]/50 font-medium">
                        {searchQuery 
                          ? `No student matches "${searchQuery}". Check search term.` 
                          : 'No active check-ins recorded yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedList.map((record: any) => {
                  const isArrived = record.arrived === true || record.arrival_time !== null;
                  const fullName = `${record.first_name || ''} ${record.last_name || ''}`;
                  const region = record.region || 'Unknown';
                  const uniqueId = record.unique_id || 'NLS-PENDING';
                  const checkInTime = record.arrival_time || record.check_in_time;
                  const method = record.arrival_method || record.method || 'manual';
                  
                  return (
                    <tr key={record._id || record.id} className="hover:bg-[#ECF4EE]/40 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={fullName} size="md" className="ring-2 ring-white shadow-xs" />
                          <div>
                            <p className="font-extrabold text-[#0C0D0D] group-hover:text-black transition-colors">
                              {fullName || 'Unknown Attendee'}
                            </p>
                            <span className="inline-block text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-[#0C0D0D]/5 text-[#0C0D0D] border border-[#0C0D0D]/10 mt-0.5">
                              {uniqueId}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-[#0C0D0D]/70">{region}</span>
                      </td>
                      <td className="px-5 py-4">
                        {checkInTime ? (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#0C0D0D]/40" />
                            <span className="text-xs font-semibold text-[#0C0D0D]/70">
                              {new Date(checkInTime).toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#0C0D0D]/40 italic font-normal">Not checked in</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#ECF4EE] text-[#0C0D0D] border border-[#0C0D0D]/10">
                          {method === 'qr_code' ? 'QR Code' : 'Manual'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {isArrived ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#0C0D0D] text-[#ECF4EE]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#ECF4EE]" />
                            Checked In
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-[#ECF4EE] text-[#0C0D0D] border border-[#0C0D0D]/10">
                            <Clock className="w-3.5 h-3.5 text-[#0C0D0D]/60" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isArrived && (
                            <button
                              onClick={() => handleCheckIn(record._id || record.id)}
                              disabled={isCheckingIn}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#0C0D0D] hover:bg-[#0C0D0D]/90 text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all disabled:opacity-50"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-[#ECF4EE]" />
                              Check In
                            </button>
                          )}
                          <button
                            onClick={() => handleView(record)}
                            className="p-2 rounded-2xl bg-white border border-[#0C0D0D]/10 hover:bg-[#ECF4EE] text-[#0C0D0D] transition-colors shadow-xs"
                            title="View Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredList.length > itemsPerPage && (
          <div className="px-5 py-4 border-t border-[#0C0D0D]/5 bg-[#FAFAFA] flex items-center justify-between">
            <p className="text-xs text-[#0C0D0D]/60 font-semibold">
              Showing <span className="font-extrabold text-[#0C0D0D]">
                {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredList.length)}
              </span> of <span className="font-extrabold text-[#0C0D0D]">{filteredList.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="h-8 text-xs font-bold rounded-xl border-[#0C0D0D]/10 bg-white text-[#0C0D0D]"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Prev
              </Button>
              <span className="text-xs font-extrabold text-[#0C0D0D] px-1">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="h-8 text-xs font-bold rounded-xl border-[#0C0D0D]/10 bg-white text-[#0C0D0D]"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ==================== GLASS OPTICAL QR SCANNER MODAL ==================== */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C0D0D]/70 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2.5 rounded-2xl bg-[#0C0D0D] text-[#ECF4EE]">
                  <Scan className="h-5 w-5" />
                </div>
                <h3 className="text-base font-extrabold text-[#0C0D0D]">Optical Scanner</h3>
              </div>
              <button
                onClick={() => setShowScanner(false)}
                className="p-1.5 rounded-full hover:bg-[#ECF4EE] text-[#0C0D0D]/40 hover:text-[#0C0D0D] transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="relative aspect-square bg-[#0C0D0D] rounded-3xl overflow-hidden border-2 border-[#ECF4EE]/30 flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(#ECF4EE_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
              
              <div className="relative w-48 h-48 border-2 border-[#ECF4EE] rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(236,244,238,0.3)]">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#ECF4EE] -mt-1 -ml-1" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#ECF4EE] -mt-1 -mr-1" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#ECF4EE] -mb-1 -ml-1" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#ECF4EE] -mb-1 -mr-1" />
                <QrCode className="h-16 w-16 text-[#ECF4EE] animate-pulse" />
              </div>

              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-[#ECF4EE] border border-white/20 backdrop-blur-md">
                  Position pass QR inside target frame
                </span>
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <Button variant="secondary" className="flex-1 rounded-2xl font-bold bg-[#FAFAFA] border-[#0C0D0D]/10" onClick={() => setShowScanner(false)}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== GLASS ATTENDEE DOSSIER MODAL ==================== */}
      {viewModalOpen && selectedAttendee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C0D0D]/70 backdrop-blur-md">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white">
            <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-[#0C0D0D]/5 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="font-extrabold text-[#0C0D0D]">Attendee Dossier</h3>
                <p className="text-xs text-[#0C0D0D]/50 font-mono font-bold">{selectedAttendee.unique_id}</p>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#ECF4EE] text-[#0C0D0D]/40 hover:text-[#0C0D0D] transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 p-5 rounded-3xl bg-[#ECF4EE] border border-[#0C0D0D]/10">
                <Avatar 
                  name={`${selectedAttendee.first_name} ${selectedAttendee.last_name}`} 
                  size="lg" 
                  className="ring-4 ring-white shadow-md"
                />
                <div>
                  <h4 className="text-xl font-extrabold text-[#0C0D0D]">
                    {selectedAttendee.first_name} {selectedAttendee.last_name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedAttendee.arrived ? (
                      <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-[#0C0D0D] text-[#ECF4EE]">
                        Verified Arrived
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-white text-[#0C0D0D] border border-[#0C0D0D]/10">
                        Pending Arrival
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#0C0D0D]/5 space-y-2">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#0C0D0D]/40">Contact Information</p>
                  <div className="space-y-1.5 text-xs text-[#0C0D0D] font-bold">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#0C0D0D]/40" />
                      <span>{selectedAttendee.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#0C0D0D]/40" />
                      <span>{selectedAttendee.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#0C0D0D]/5 space-y-2">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#0C0D0D]/40">Delegation Details</p>
                  <div className="space-y-1.5 text-xs text-[#0C0D0D] font-bold">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#0C0D0D]/40" />
                      <span>{selectedAttendee.region}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-[#0C0D0D]/40" />
                      <span>{selectedAttendee.local_church || 'Central Fellowship'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#ECF4EE]/60 border border-[#0C0D0D]/10 sm:col-span-2 space-y-2">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[#0C0D0D]/60">Lodging & Room Quarters</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-extrabold text-[#0C0D0D]">
                    <div className="p-2.5 rounded-xl bg-white border border-[#0C0D0D]/5 shadow-xs">
                      <span className="block text-[10px] text-[#0C0D0D]/40 font-semibold">Building</span>
                      {selectedAttendee.dorm_cache?.buildingName || 'Unassigned'}
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-[#0C0D0D]/5 shadow-xs">
                      <span className="block text-[10px] text-[#0C0D0D]/40 font-semibold">Floor</span>
                      {selectedAttendee.dorm_cache?.floor || '1'}
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-[#0C0D0D]/5 shadow-xs">
                      <span className="block text-[10px] text-[#0C0D0D]/40 font-semibold">Room</span>
                      {selectedAttendee.dorm_cache?.roomNumber || 'N/A'}
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-[#0C0D0D]/5 shadow-xs">
                      <span className="block text-[10px] text-[#0C0D0D]/40 font-semibold">Bed</span>
                      {selectedAttendee.dorm_cache?.bedNumber || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-3 pt-2">
                {!selectedAttendee.arrived && (
                  <Button 
                    variant="primary" 
                    className="flex-1 bg-[#0C0D0D] hover:bg-[#0C0D0D]/90 text-white rounded-2xl py-3 font-extrabold"
                    onClick={() => {
                      handleCheckIn(selectedAttendee._id);
                      setViewModalOpen(false);
                    }}
                    disabled={isCheckingIn}
                  >
                    Confirm Check In
                  </Button>
                )}
                <Button 
                  variant="secondary" 
                  className="rounded-2xl border-[#0C0D0D]/10 bg-[#FAFAFA] text-[#0C0D0D] font-bold"
                  onClick={() => setViewModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}