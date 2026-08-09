// src/app/dashboard/users/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Shield,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  Mail,
  Phone,
  Calendar,
  Filter
} from 'lucide-react';
import { Badge } from '@/src/components/ui/Badge';
import { Button } from '@/src/components/ui/Button';
import { Avatar } from '@/src/components/ui/Avatar';
import { useUser } from '@/src/hooks/useUser';
import { toast } from 'sonner';

export default function UsersPage() {
  const router = useRouter();
  const {
    users,
    isLoading,
    error,
    pagination,
    fetchUsers,
    deleteUser,
    refetch,
    clearError,
  } = useUser();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers({ page: 1, limit: itemsPerPage });
  }, []);

  // Handle filter changes
  useEffect(() => {
    const filters: any = { page: currentPage, limit: itemsPerPage };
    if (searchQuery) filters.search = searchQuery;
    if (selectedRole !== 'all') filters.role = selectedRole;
    if (selectedStatus !== 'all') filters.status = selectedStatus;
    fetchUsers(filters);
  }, [currentPage, itemsPerPage, selectedRole, selectedStatus, searchQuery]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"?`)) return;

    setIsDeleting(id);
    try {
      await deleteUser(id);
      toast.success(`User ${name} deleted successfully`);
      await refetch();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete user');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Users refreshed');
    } catch {
      toast.error('Failed to refresh users');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'admin':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'staff':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Shield className="h-3 w-3" />;
      case 'admin':
        return <Shield className="h-3 w-3" />;
      default:
        return <Users className="h-3 w-3" />;
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />;
  };

  const getStatusLabel = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] rounded-3xl bg-[#ECF4EE]/40 border border-[#ECF4EE] text-[#0C0D0D]">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#0C0D0D]/5 blur-xl animate-pulse" />
          <Loader2 className="h-10 w-10 text-[#0C0D0D] animate-spin relative z-10" />
        </div>
        <p className="mt-4 text-xs font-bold text-[#0C0D0D]/60 tracking-wider uppercase">
          Loading Users...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center">
        <p className="text-rose-700 font-medium">Error loading users: {error}</p>
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
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-[#ECF4EE] border border-[#d2e5d7] p-6 sm:p-8 text-[#0C0D0D] shadow-sm">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#0C0D0D]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#0C0D0D] text-[#ECF4EE]">
                <Sparkles className="w-3 h-3 text-[#ECF4EE]" /> User Management
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0C0D0D]">
              Staff & Users
            </h1>
            <p className="text-xs sm:text-sm text-[#0C0D0D]/70 font-medium">
              Manage system administrators and staff members with role-based access control.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => router.push('/dashboard/users/create')}
              className="flex items-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 transition-all px-4 py-2.5 rounded-2xl text-xs font-bold shadow-xs cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              Add User
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

      {/* Filters */}
      <div className="bg-white rounded-3xl border border-[#ECF4EE] shadow-xs p-4 sm:p-5 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 flex-wrap items-center">
          <div className="flex-1 min-w-[200px] w-full relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0C0D0D]/40" />
            <input
              type="text"
              placeholder="Search by name, email or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#ECF4EE] focus:border-[#0C0D0D]/30 rounded-2xl text-xs font-medium text-[#0C0D0D] placeholder-[#0C0D0D]/40 focus:outline-none transition-all shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2.5 bg-white border border-[#ECF4EE] rounded-2xl text-xs font-medium text-[#0C0D0D] focus:outline-none focus:border-[#0C0D0D]/30 shadow-2xs cursor-pointer min-w-[150px]"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2.5 bg-white border border-[#ECF4EE] rounded-2xl text-xs font-medium text-[#0C0D0D] focus:outline-none focus:border-[#0C0D0D]/30 shadow-2xs cursor-pointer min-w-[130px]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedRole !== 'all' || selectedStatus !== 'all' || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#ECF4EE]">
            <span className="text-xs font-bold text-[#0C0D0D]/50 uppercase tracking-wider">Active:</span>
            {selectedRole !== 'all' && (
              <Badge variant="info" className="flex items-center gap-1.5 bg-[#ECF4EE] text-[#0C0D0D] border-[#d2e5d7] text-[10px] font-bold px-2.5 py-1 rounded-xl">
                Role: {selectedRole.replace('_', ' ')}
                <button onClick={() => setSelectedRole('all')} className="hover:text-rose-600 cursor-pointer">
                  <XCircle className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedStatus !== 'all' && (
              <Badge variant="info" className="flex items-center gap-1.5 bg-[#ECF4EE] text-[#0C0D0D] border-[#d2e5d7] text-[10px] font-bold px-2.5 py-1 rounded-xl">
                Status: {selectedStatus}
                <button onClick={() => setSelectedStatus('all')} className="hover:text-rose-600 cursor-pointer">
                  <XCircle className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="info" className="flex items-center gap-1.5 bg-[#ECF4EE] text-[#0C0D0D] border-[#d2e5d7] text-[10px] font-bold px-2.5 py-1 rounded-xl">
                Query: {searchQuery}
                <button onClick={() => setSearchQuery('')} className="hover:text-rose-600 cursor-pointer">
                  <XCircle className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <button
              onClick={() => {
                setSelectedRole('all');
                setSelectedStatus('all');
                setSearchQuery('');
                refetch();
              }}
              className="text-xs font-bold text-[#0C0D0D] hover:underline ml-1 cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-[#ECF4EE] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#ECF4EE] bg-[#ECF4EE]/40 text-[#0C0D0D]/60">
                <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">User</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Contact</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Role</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-black uppercase tracking-wider">Last Login</th>
                <th className="px-5 py-3.5 text-right text-[11px] font-black uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECF4EE]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs font-semibold text-[#0C0D0D]/50">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-[#ECF4EE]/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={user.name}
                          size="md"
                          className="rounded-2xl ring-2 ring-[#ECF4EE] bg-[#0C0D0D] text-white"
                        />
                        <div>
                          <p className="text-sm font-bold text-[#0C0D0D]">{user.name}</p>
                          <p className="text-[11px] font-mono font-medium text-[#0C0D0D]/40">{user.user_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-[#0C0D0D]">
                          <Mail className="h-3 w-3 text-[#0C0D0D]/40" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-[#0C0D0D]/60">
                            <Phone className="h-3 w-3 text-[#0C0D0D]/40" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="info" className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${getRoleBadge(user.role)}`}>
                        <span className="flex items-center gap-1.5">
                          {getRoleIcon(user.role)}
                          {user.role.replace('_', ' ')}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="info" className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${getStatusBadge(user.is_active)}`}>
                        <span className="flex items-center gap-1.5">
                          {getStatusIcon(user.is_active)}
                          {getStatusLabel(user.is_active)}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-[#0C0D0D]/50">
                        <Calendar className="h-3 w-3" />
                        <span>{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors"
                          onClick={() => router.push(`/dashboard/users/${user._id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-xl hover:bg-[#ECF4EE] text-[#0C0D0D]/60 hover:text-[#0C0D0D] transition-colors"
                          onClick={() => router.push(`/dashboard/users/${user._id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-xl hover:bg-rose-50 text-[#0C0D0D]/60 hover:text-rose-600 transition-colors"
                          onClick={() => handleDelete(user._id, user.name)}
                          disabled={isDeleting === user._id}
                        >
                          {isDeleting === user._id ? (
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

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-5 py-4 bg-[#FAFAFA] border-t border-[#ECF4EE] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[#0C0D0D]/60 font-medium">
              Showing <span className="font-bold text-[#0C0D0D]">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-bold text-[#0C0D0D]">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
              <span className="font-bold text-[#0C0D0D]">{pagination.total}</span> users
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => setCurrentPage(pagination.page - 1)}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-[#ECF4EE] rounded-xl text-xs font-bold text-[#0C0D0D] disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs hover:border-[#0C0D0D]/20 transition-all cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-xs font-extrabold text-[#0C0D0D] px-2">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setCurrentPage(pagination.page + 1)}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-[#ECF4EE] rounded-xl text-xs font-bold text-[#0C0D0D] disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs hover:border-[#0C0D0D]/20 transition-all cursor-pointer"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}