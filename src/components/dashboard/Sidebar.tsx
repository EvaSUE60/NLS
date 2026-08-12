// src/components/dashboard/Sidebar.tsx
'use client';

import { useState, useEffect } from 'react';
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
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface MenuItem {
  label: string;
  href: string;
  icon: any;
  roles: string[];
  category?: 'main' | 'management';
}

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
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
    label: 'Dorms',
    href: '/dashboard/dorm',
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
    label: 'Sessions',
    href: '/dashboard/sessions',
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

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Reset collapse state on mobile
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(false);
    }
  }, [isMobile]);

  // Auto-close mobile sidebar on navigation
  useEffect(() => {
    if (isMobile && isOpen && onClose) {
      onClose();
    }
  }, [pathname, isMobile, isOpen, onClose]);

  // Handle escape key for mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobile && isOpen) {
        setIsOpen(false);
        onClose?.();
      }
    };

    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobile, isOpen, onClose]);

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(role || 'staff')
  );

  const mainSection = filteredMenu.filter((item) => item.category === 'main');
  const managementSection = filteredMenu.filter((item) => item.category === 'management');

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const renderNavLink = (item: MenuItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'relative flex items-center gap-3 rounded-2xl text-xs font-semibold transition-all duration-200 group',
          isMobile ? 'px-4 py-3' : 'px-3.5 py-2.5',
          active
            ? 'bg-[#ECF4EE] text-[#0C0D0D] font-bold shadow-sm border border-[#ECF4EE]'
            : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
        )}
      >
        {/* Active Indicator Pill */}
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#0C0D0D] rounded-r-full shadow-sm" />
        )}

        <item.icon
          size={isMobile ? 20 : 18}
          className={cn(
            'flex-shrink-0 transition-colors duration-200',
            active ? 'text-[#0C0D0D]' : 'text-white/40 group-hover:text-white'
          )}
        />

        {(!isCollapsed || isMobile) && (
          <span className="truncate tracking-wide">{item.label}</span>
        )}

        {/* Tooltip for collapsed desktop */}
        {!isMobile && isCollapsed && (
          <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#0C0D0D] text-[#ECF4EE] text-xs font-semibold rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-white/10">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  // Mobile toggle button
  const MobileToggleButton = () => (
    <button
      onClick={() => {
        setIsOpen(!isOpen);
        if (!isOpen) onClose?.();
      }}
      className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700"
      aria-label={isOpen ? 'Close sidebar navigation' : 'Open sidebar navigation'}
      aria-expanded={isOpen}
    >
      <Menu size={24} />
    </button>
  );

  // Mobile drawer
  const MobileDrawer = () => {
    if (!isOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden"
          onClick={() => {
            setIsOpen(false);
            onClose?.();
          }}
          aria-hidden="true"
        />

        {/* Panel */}
        <div className="fixed inset-y-0 left-0 z-50 w-[280px] bg-slate-950 shadow-2xl transition-transform duration-300 ease-out transform translate-x-0 lg:hidden">
          <div className="relative h-full">
            {/* Close Button */}
            <button
              onClick={() => {
                setIsOpen(false);
                onClose?.();
              }}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-slate-700"
              aria-label="Close sidebar navigation"
            >
              <X size={18} />
            </button>

            {/* Sidebar Content for Mobile */}
            <SidebarContent isMobile={true} />
          </div>
        </div>
      </>
    );
  };

  // Desktop sidebar
  const DesktopSidebar = () => (
    <div className="hidden lg:block h-full flex-shrink-0">
      <SidebarContent isMobile={false} />
    </div>
  );

  // Main Sidebar Content
  const SidebarContent = ({ isMobile: mobile = false }) => (
    <aside
      className={cn(
        'h-full bg-[#0C0D0D] text-white border-r border-white/10 transition-all duration-300 flex flex-col select-none relative shadow-xl',
        mobile ? 'w-full' : (isCollapsed ? 'w-20' : 'w-64')
      )}
    >
      {/* Brand Header */}
      <div
        className={cn(
          'flex items-center h-20 px-4 border-b border-white/10 flex-shrink-0',
          mobile ? 'justify-between' : (isCollapsed ? 'justify-center' : 'justify-between')
        )}
      >
        {mobile ? (
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D] border border-white/20 flex items-center justify-center shadow-md font-black text-base tracking-wider transition-transform group-hover:scale-105">
              N
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-sm tracking-tight flex items-center gap-1.5">
                NLS Portal
                <Sparkles className="w-3 h-3 text-[#ECF4EE]" />
              </span>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                Edition 2026
              </span>
            </div>
          </Link>
        ) : (
          !isCollapsed ? (
            <>
              <Link href="/dashboard" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D] border border-white/20 flex items-center justify-center shadow-md font-black text-base tracking-wider transition-transform group-hover:scale-105">
                  N
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-white text-sm tracking-tight flex items-center gap-1.5">
                    NLS Portal
                    <Sparkles className="w-3 h-3 text-[#ECF4EE]" />
                  </span>
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    Edition 2026
                  </span>
                </div>
              </Link>

              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all active:scale-95"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Link
                href="/dashboard"
                className="w-9 h-9 rounded-2xl bg-[#ECF4EE] text-[#0C0D0D] border border-white/20 flex items-center justify-center shadow-md font-black text-base"
              >
                N
              </Link>
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all active:scale-95"
                aria-label="Expand sidebar"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
        {/* Main Section */}
        <div className="space-y-1">
          {(!isCollapsed || mobile) && (
            <p className="px-3.5 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-white/30">
              Overview & Operations
            </p>
          )}
          {mainSection.map(renderNavLink)}
        </div>

        {/* Management Section */}
        {managementSection.length > 0 && (
          <div className="space-y-1 pt-3 border-t border-white/10">
            {(!isCollapsed || mobile) && (
              <p className="px-3.5 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-white/30">
                Administration
              </p>
            )}
            {managementSection.map(renderNavLink)}
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="border-t border-white/10 p-3 bg-black/30 flex-shrink-0">
        {(!isCollapsed || mobile) ? (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="w-8 h-8 rounded-xl bg-[#ECF4EE] text-[#0C0D0D] font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {user?.name || 'Administrator'}
              </p>
              <p className="text-[10px] font-medium text-white/40 truncate capitalize">
                {role ? role.replace('_', ' ') : 'Staff Member'}
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-95"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-1">
            <div className="w-8 h-8 rounded-xl bg-[#ECF4EE] text-[#0C0D0D] font-extrabold text-xs flex items-center justify-center shadow-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-95"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  // If this is the mobile wrapper, return the toggle button and drawer
  if (isMobile) {
    return (
      <>
        <MobileToggleButton />
        <MobileDrawer />
      </>
    );
  }

  // Desktop version
  return <DesktopSidebar />;
}