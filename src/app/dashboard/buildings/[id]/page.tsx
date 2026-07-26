// src/app/dashboard/buildings/[id]/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Edit,
  Trash2,
  Plus,
  DoorOpen,
  Bed,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Download,
  Loader2,
  User
} from 'lucide-react';
import { Card } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { useBuilding } from '@/src/hooks/useBuilding';
import { toast } from 'sonner';

interface BuildingDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function BuildingDetailPage({ params }: BuildingDetailPageProps) {
  const router = useRouter();
  // ✅ Unwrap params using React.use()
  const { id } = use(params);
  
  const {
    selectedBuilding: building,
    selectedBuildingStats: stats,
    isLoading,
    error,
    fetchBuilding,
    deleteBuilding,
    clearSelected,
    clearError,
  } = useBuilding();

  const [expandedFloors, setExpandedFloors] = useState<Set<number>>(new Set([1, 2, 3]));
  const [isDeleting, setIsDeleting] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);

  // Fetch building data when id is available
  useEffect(() => {
    if (id) {
      fetchBuilding(id);
    }
    return () => {
      clearSelected();
    };
  }, [id]);

  // Mock rooms data - in real implementation, this would come from the API
  useEffect(() => {
    // This would be replaced with actual API data
    const mockRooms = [
      {
        _id: '1',
        room_number: '1-01',
        floor: 1,
        floor_name: 'Ground',
        capacity: 4,
        current_occupancy: 4,
        is_full: true,
        check_in_status: 'full',
        occupants: [
          { full_name: 'Netanet Abrham sedamo', unique_id: 'NLS-2026-046' },
          { full_name: 'Ruth tsegaye Bansa', unique_id: 'NLS-2026-036' }
        ],
        bed_numbers: [1, 2, 3, 4]
      },
      {
        _id: '2',
        room_number: '1-02',
        floor: 1,
        floor_name: 'Ground',
        capacity: 4,
        current_occupancy: 2,
        is_full: false,
        check_in_status: 'partial',
        occupants: [
          { full_name: 'Amelework Ayele', unique_id: 'NLS-2026-074' }
        ],
        bed_numbers: [1, 2, 3, 4]
      },
      {
        _id: '3',
        room_number: '1-03',
        floor: 1,
        floor_name: 'Ground',
        capacity: 4,
        current_occupancy: 0,
        is_full: false,
        check_in_status: 'empty',
        occupants: [],
        bed_numbers: [1, 2, 3, 4]
      },
      {
        _id: '4',
        room_number: '2-01',
        floor: 2,
        floor_name: '1st',
        capacity: 4,
        current_occupancy: 3,
        is_full: false,
        check_in_status: 'partial',
        occupants: [
          { full_name: 'Test User 1', unique_id: 'NLS-2026-100' },
          { full_name: 'Test User 2', unique_id: 'NLS-2026-101' }
        ],
        bed_numbers: [1, 2, 3, 4]
      },
      {
        _id: '5',
        room_number: '2-02',
        floor: 2,
        floor_name: '1st',
        capacity: 4,
        current_occupancy: 4,
        is_full: true,
        check_in_status: 'full',
        occupants: [
          { full_name: 'Test User 3', unique_id: 'NLS-2026-102' },
          { full_name: 'Test User 4', unique_id: 'NLS-2026-103' }
        ],
        bed_numbers: [1, 2, 3, 4]
      },
      {
        _id: '6',
        room_number: '2-03',
        floor: 2,
        floor_name: '1st',
        capacity: 4,
        current_occupancy: 0,
        is_full: false,
        check_in_status: 'empty',
        occupants: [],
        bed_numbers: [1, 2, 3, 4]
      },
      {
        _id: '7',
        room_number: '3-01',
        floor: 3,
        floor_name: '2nd',
        capacity: 4,
        current_occupancy: 2,
        is_full: false,
        check_in_status: 'partial',
        occupants: [
          { full_name: 'Test User 5', unique_id: 'NLS-2026-104' }
        ],
        bed_numbers: [1, 2, 3, 4]
      },
      {
        _id: '8',
        room_number: '3-02',
        floor: 3,
        floor_name: '2nd',
        capacity: 4,
        current_occupancy: 4,
        is_full: true,
        check_in_status: 'full',
        occupants: [
          { full_name: 'Test User 6', unique_id: 'NLS-2026-105' },
          { full_name: 'Test User 7', unique_id: 'NLS-2026-106' }
        ],
        bed_numbers: [1, 2, 3, 4]
      },
      {
        _id: '9',
        room_number: '3-03',
        floor: 3,
        floor_name: '2nd',
        capacity: 4,
        current_occupancy: 0,
        is_full: false,
        check_in_status: 'empty',
        occupants: [],
        bed_numbers: [1, 2, 3, 4]
      }
    ];
    setRooms(mockRooms);
  }, []);

  const toggleFloor = (floor: number) => {
    const newSet = new Set(expandedFloors);
    if (newSet.has(floor)) {
      newSet.delete(floor);
    } else {
      newSet.add(floor);
    }
    setExpandedFloors(newSet);
  };

  const handleDelete = async () => {
    if (!building) return;
    if (!confirm(`Are you sure you want to delete "${building.name}"? This will also delete all rooms in this building.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteBuilding(id);
      toast.success(`Building "${building.name}" deleted successfully`);
      router.push('/dashboard/buildings');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete building');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'partial':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'empty':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'full':
        return <CheckCircle className="h-3.5 w-3.5" />;
      case 'partial':
        return <AlertCircle className="h-3.5 w-3.5" />;
      case 'empty':
        return <XCircle className="h-3.5 w-3.5" />;
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

  const floorNames: { [key: number]: string } = {
    1: 'Ground Floor',
    2: '1st Floor',
    3: '2nd Floor',
    4: '3rd Floor',
    5: '4th Floor',
  };

  // Group rooms by floor
  const roomsByFloor = rooms.reduce((acc: any, room: any) => {
    const floor = room.floor || 1;
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {});

  if (isLoading && !building) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading building details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
        <p className="text-rose-600">Error loading building: {error}</p>
        <Button variant="primary" className="mt-4" onClick={() => { clearError(); fetchBuilding(id); }}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600">Building not found</h3>
        <Link href="/dashboard/buildings">
          <Button variant="primary" className="mt-4">Back to Buildings</Button>
        </Link>
      </div>
    );
  }

  // Calculate occupancy rate
  const occupancyRate = stats?.occupancy_rate 
    ? parseFloat(stats.occupancy_rate) 
    : building.capacity > 0 
      ? Math.round(((building.current_occupancy || 0) / building.capacity) * 100) 
      : 0;

  // Get building stats
  const totalRooms = building.total_rooms || building.room_count || 0;
  const occupiedRooms = building.occupied_rooms || 0;
  const availableRooms = building.available_rooms || (totalRooms - occupiedRooms) || 0;
  const totalBeds = building.total_beds || building.capacity || 0;
  const occupiedBeds = building.total_occupants || building.current_occupancy || 0;
  const availableBeds = building.available_beds || (totalBeds - occupiedBeds) || 0;

  return (
    <div className="space-y-6">
      {/* ==================== HEADER ==================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/buildings"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{building.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant={building.type === 'men' ? 'info' : 'warning'}>
                {building.type === 'men' ? "Men's Building" : "Women's Building"}
              </Badge>
              <Badge variant={building.is_active ? 'success' : 'danger'}>
                {building.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {building.address && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {building.address}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/buildings/${id}/edit`}>
            <Button variant="secondary" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button 
            variant="danger" 
            className="flex items-center gap-2"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </Button>
        </div>
      </div>

      {/* ==================== STATS CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Rooms</p>
              <p className="mt-1 text-3xl font-bold text-gray-800">{totalRooms}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <DoorOpen className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-emerald-600 font-medium">{availableRooms} available</span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-500">{occupiedRooms} occupied</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Beds</p>
              <p className="mt-1 text-3xl font-bold text-gray-800">{totalBeds}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Bed className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-emerald-600 font-medium">{availableBeds} available</span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-500">{occupiedBeds} occupied</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Occupancy Rate</p>
              <p className="mt-1 text-3xl font-bold text-gray-800">{occupancyRate}%</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  occupancyRate >= 80 ? 'bg-emerald-500' :
                  occupancyRate >= 50 ? 'bg-amber-500' :
                  'bg-rose-500'
                }`}
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Floors</p>
              <p className="mt-1 text-3xl font-bold text-gray-800">{building.floors || 0}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">
            <span>{totalRooms && building.floors ? Math.round(totalRooms / building.floors) : 0} rooms per floor</span>
          </div>
        </div>
      </div>

      {/* ==================== BUILDING INFO ==================== */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Building Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium text-gray-800">{building.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Type</dt>
                <dd className="font-medium text-gray-800 capitalize">{building.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Floors</dt>
                <dd className="font-medium text-gray-800">{building.floors || 0}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Total Rooms</dt>
                <dd className="font-medium text-gray-800">{totalRooms}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Total Beds</dt>
                <dd className="font-medium text-gray-800">{totalBeds}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Location & Status</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Address</dt>
                <dd className="font-medium text-gray-800">{building.address || 'N/A'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd className="font-medium">
                  <Badge variant={building.is_active ? 'success' : 'danger'}>
                    {building.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </dd>
              </div>
              {building.created_at && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Created</dt>
                  <dd className="font-medium text-gray-800">
                    {new Date(building.created_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {building.updated_at && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Last Updated</dt>
                  <dd className="font-medium text-gray-800">
                    {new Date(building.updated_at).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
            {building.description && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">{building.description}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ==================== ROOMS BY FLOOR ==================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Room Overview</h2>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/buildings/${id}/rooms/create`}>
              <Button variant="primary" size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Room
              </Button>
            </Link>
            <Button variant="secondary" size="sm" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button variant="secondary" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-xl">
          <span className="text-xs font-medium text-gray-500">Status:</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-600">Full</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-gray-600">Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-xs text-gray-600">Empty</span>
            </div>
          </div>
        </div>

        {/* Floors */}
        {Object.entries(roomsByFloor).map(([floorKey, floorRooms]: [string, any]) => {
          const floor = parseInt(floorKey);
          const totalRoomsOnFloor = floorRooms.length;
          const fullRooms = floorRooms.filter((r: any) => r.check_in_status === 'full').length;
          const partialRooms = floorRooms.filter((r: any) => r.check_in_status === 'partial').length;
          const emptyRooms = floorRooms.filter((r: any) => r.check_in_status === 'empty').length;
          const isExpanded = expandedFloors.has(floor);

          return (
            <Card key={floor} className="overflow-hidden">
              <button
                onClick={() => toggleFloor(floor)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800">{floorNames[floor] || `Floor ${floor}`}</h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span>{totalRoomsOnFloor} rooms</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-emerald-600">{fullRooms} full</span>
                      <span className="text-amber-600">{partialRooms} partial</span>
                      <span className="text-rose-600">{emptyRooms} empty</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="h-1.5 rounded-full bg-emerald-500"
                        style={{ width: `${(fullRooms / totalRoomsOnFloor) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{Math.round((fullRooms / totalRoomsOnFloor) * 100)}%</span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="p-4 border-t border-gray-100">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {floorRooms.map((room: any) => (
                      <Link
                        key={room._id}
                        href={`/dashboard/rooms/${room._id}`}
                        className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-800 text-sm">{room.room_number}</span>
                          <Badge variant="info" className={`text-xs ${getStatusColor(room.check_in_status)}`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(room.check_in_status)}
                              {getStatusLabel(room.check_in_status)}
                            </span>
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs">
                          <span className="text-gray-500">Beds</span>
                          <span className="font-medium text-gray-700">
                            <span className={room.current_occupancy > 0 ? 'text-emerald-600' : 'text-gray-400'}>
                              {room.current_occupancy}
                            </span>
                            <span className="text-gray-300">/</span>
                            {room.capacity}
                          </span>
                        </div>
                        <div className="mt-1.5 w-full bg-gray-200 rounded-full h-1">
                          <div 
                            className={`h-1 rounded-full ${
                              room.check_in_status === 'full' ? 'bg-emerald-500' :
                              room.check_in_status === 'partial' ? 'bg-amber-500' :
                              'bg-rose-500'
                            }`}
                            style={{ width: `${(room.current_occupancy / room.capacity) * 100}%` }}
                          />
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-400">
                          <User className="h-3 w-3" />
                          <span>{room.current_occupancy} occupied</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}