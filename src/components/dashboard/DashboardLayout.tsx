// src/components/dashboard/DashboardLayout.tsx
'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '@/src/hooks/useAuth';
import { cn } from '@/src/lib/utils';
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
  Sparkles,
  X,
  LogOut,
} from 'lucide-react';
import { Avatar } from '@/src/components/ui/Avatar';
import { Badge } from '@/src/components/ui/Badge';

interface MenuItem {
  label: string;
  href: string;
  icon: any;
  roles: string[];
  category?: 'main' | 'management';
}

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
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

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user, role, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter menu items based on user role
  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(role || 'staff')
  );

  const mainSection = filteredMenu.filter((item) => item.category === 'main');
  const managementSection = filteredMenu.filter((item) => item.category === 'management');

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
          active
            ? 'bg-[#ECF4EE] text-[#0C0D0D] font-bold shadow-sm'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
        )}
      >
        <item.icon
          size={18}
          className={cn(
            'flex-shrink-0',
            active ? 'text-[#0C0D0D]' : 'text-slate-500'
          )}
        />
        <span className="truncate">{item.label}</span>
        {active && (
          <span className="ml-auto w-1.5 h-6 bg-[#0C0D0D] rounded-full" />
        )}
      </Link>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header with Mobile Menu Toggle */}
        <Header 
          title={title} 
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMenuOpen={isMobileMenuOpen}
        />

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Menu Overlay - Full screen navigation */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 lg:hidden animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Mobile Menu Panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-[280px] sm:w-80 bg-white shadow-2xl animate-in slide-in-from-left duration-300 ease-out lg:hidden overflow-y-auto">
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#0C0D0D] text-white flex items-center justify-center font-bold text-sm">
                    N
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      NLS Portal
                      <Sparkles className="w-3 h-3 text-[#0C0D0D]" />
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                      Edition 2026
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label="Close menu"
                >
                  <X size={20} className="text-slate-600" />
                </button>
              </div>

              {/* Mobile Navigation Links from Sidebar */}
              <nav className="flex-1 p-4 space-y-6">
                {/* Main Section */}
                {mainSection.length > 0 && (
                  <div className="space-y-1">
                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Overview & Operations
                    </p>
                    {mainSection.map(renderNavLink)}
                  </div>
                )}

                {/* Management Section */}
                {managementSection.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-slate-200">
                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Administration
                    </p>
                    {managementSection.map(renderNavLink)}
                  </div>
                )}
              </nav>

              {/* Mobile Menu Footer - User Info & Logout */}
              <div className="p-4 border-t border-slate-200 bg-slate-50/50 sticky bottom-0">
                <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-200">
                  <Avatar name={user?.name || 'User'} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate capitalize">
                      {role || 'staff'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                    aria-label="Logout"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}