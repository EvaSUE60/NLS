// src/components/dashboard/Sidebar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  DoorOpen,
  BookOpen,
  Group,
  Calendar,
  CheckSquare,
  ClipboardList,
  Settings,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface MenuItem {
  label: string;
  href: string;
  icon: any;
  roles: string[];
  category?: 'main' | 'management';
}

const menuItems: MenuItem[] = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'admin', 'staff'],
    category: 'main',
  },
  {
    label: 'Attendees',
    href: '/dashboard/attendees',
    icon: Users,
    roles: ['super_admin', 'admin', 'staff'],
    category: 'main',
  },
  {
    label: 'Check In',
    href: '/dashboard/check-in',
    icon: CheckSquare,
    roles: ['super_admin', 'admin', 'staff'],
    category: 'main',
  },
  {
    label: 'Attendance',
    href: '/dashboard/attendance',
    icon: ClipboardList,
    roles: ['super_admin', 'admin', 'staff'],
    category: 'main',
  },
  {
    label: 'Schedule',
    href: '/dashboard/schedule',
    icon: Calendar,
    roles: ['super_admin', 'admin', 'staff'],
    category: 'main',
  },
  {
    label: 'Buildings',
    href: '/dashboard/buildings',
    icon: Building2,
    roles: ['admin', 'super_admin'],
    category: 'management',
  },
  {
    label: 'Rooms',
    href: '/dashboard/rooms',
    icon: DoorOpen,
    roles: ['admin', 'super_admin'],
    category: 'management',
  },
  {
    label: 'Seminars',
    href: '/dashboard/seminars',
    icon: BookOpen,
    roles: ['admin', 'super_admin'],
    category: 'management',
  },
  {
    label: 'Groups',
    href: '/dashboard/groups',
    icon: Group,
    roles: ['admin', 'super_admin'],
    category: 'management',
  },
  {
    label: 'Reports',
    href: '/dashboard/reports',
    icon: BarChart3,
    roles: ['admin', 'super_admin'],
    category: 'management',
  },
  {
    label: 'User Management',
    href: '/dashboard/users',
    icon: UserCheck,
    roles: ['super_admin'],
    category: 'management',
  },
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['super_admin'],
    category: 'management',
  },
];

export function Sidebar() {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(role || 'staff')
  );

  const mainSection = filteredMenu.filter((item) => item.category === 'main');
  const managementSection = filteredMenu.filter((item) => item.category === 'management');

  const isActive = (href: string) => pathname === href;

  const renderNavLink = (item: MenuItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group',
          active
            ? 'bg-sky-800/90 text-white shadow-xs border border-sky-700/60'
            : 'text-sky-400 hover:text-sky-200 hover:bg-sky-900/60'
        )}
      >
        {/* Active Pill Indicator */}
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sky-500 rounded-r-full shadow-sm" />
        )}

        <item.icon
          size={18}
          className={cn(
            'flex-shrink-0 transition-colors duration-200',
            active ? 'text-white' : 'text-slate-400 group-hover:text-sky-200'
          )}
        />

        {!isCollapsed && (
          <span className="truncate tracking-wide">{item.label}</span>
        )}

        {/* Floating Tooltip when collapsed */}
        {isCollapsed && (
          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-sky-900 text-slate-200 text-xs font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-slate-800">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'h-full bg-sky-950 border-r border-sky-800/80 transition-all duration-300 flex flex-col select-none relative',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand & Toggle Header */}
      <div
        className={cn(
          'flex items-center h-16 px-4 border-b border-slate-800/80',
          isCollapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!isCollapsed ? (
          <>
            <Link href="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-sky-900 border border-sky-800 flex items-center justify-center shadow-xs group-hover:border-slate-700 transition-all">
                <span className="text-white font-extrabold text-sm tracking-widest">N</span>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 -ml-0.5 mb-2" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-white text-sm tracking-tight">NLS Portal</span>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Edition 2026</span>
              </div>
            </Link>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Link href="/dashboard" className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-xs">
              <span className="text-white font-extrabold text-sm">N</span>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 -ml-0.5 mb-2" />
            </Link>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Body */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-900">
        {/* Main Section */}
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Overview & Operations
            </p>
          )}
          {mainSection.map(renderNavLink)}
        </div>

        {/* Management Section */}
        {managementSection.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-slate-800/50">
            {!isCollapsed && (
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Administration
              </p>
            )}
            {managementSection.map(renderNavLink)}
          </div>
        )}
      </nav>

      {/* User Profile & Footer Section */}
      <div className="border-t border-slate-800/80 p-3 bg-slate-950/80">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-200 truncate">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] text-slate-500 truncate capitalize">
                {role ? role.replace('_', ' ') : 'Staff Member'}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-1">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-900 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}