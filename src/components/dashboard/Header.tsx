// src/components/dashboard/Header.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { Avatar } from '@/src/components/ui/Avatar';
import { Badge } from '@/src/components/ui/Badge';
import { Bell, ChevronDown, LogOut, Settings, User, Menu, X } from 'lucide-react';

interface HeaderProps {
  title?: string;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
}

export function Header({ title = 'Dashboard', onMenuToggle, isMenuOpen = false }: HeaderProps) {
  const { user, role, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getUserName = () => {
    if (!user?.name) return 'User';
    return user.name.split(' ')[0] || 'User';
  };

  return (
    <header className="bg-white border-b border-slate-200 flex-shrink-0 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      <div className="px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-3.5 max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between gap-2">
          {/* Left Side: Mobile Menu Toggle & Title */}
          <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
            {/* Mobile Menu Toggle Button */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-900 tracking-tight truncate">
                {title}
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 hidden xs:block font-medium truncate">
                Welcome back, <span className="text-slate-800 font-semibold">{getUserName()}</span>!
              </p>
            </div>
          </div>

          {/* Right Side: Quick Actions & Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
            {/* Notifications Button */}
            <button
              className="relative p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
              aria-label="Notifications"
            >
              <Bell size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>

            {/* User Role Badge - Hide on very small screens */}
            <Badge
              variant="info"
              size="sm"
              className="hidden sm:inline-flex capitalize bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-[10px] md:text-[11px] px-2 md:px-2.5 py-0.5 md:py-1"
            >
              {role || 'staff'}
            </Badge>

            {/* Profile Dropdown Container */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2.5 p-1 sm:p-1.5 md:px-3 md:py-1.5 rounded-xl text-slate-700 hover:bg-slate-100/80 transition-all focus:outline-none focus:ring-2 focus:ring-slate-200"
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
              >
                <Avatar
                  name={user?.name || 'User'}
                  size="sm"
                  className="ring-2 ring-slate-100 w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm"
                />
                <span className="hidden sm:inline text-xs font-semibold text-slate-800 max-w-[60px] md:max-w-[100px] truncate">
                  {getUserName()}
                </span>
                <ChevronDown
                  size={14}
                  className={`hidden sm:block text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''
                    }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 sm:w-60 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* User Info Header */}
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-100">
                    <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{user?.name || 'User'}</p>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 truncate mt-0.5">{user?.email || 'user@example.com'}</p>
                    <div className="mt-1.5 sm:mt-2">
                      <Badge
                        variant="info"
                        size="sm"
                        className="capitalize bg-slate-100 text-slate-700 border border-slate-200 font-medium text-[10px]"
                      >
                        {role || 'staff'}
                      </Badge>
                    </div>
                  </div>

                  {/* Dropdown Navigation Actions */}
                  <div className="py-1">
                    <button className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <User size={15} className="text-slate-500" />
                      Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <Settings size={15} className="text-slate-500" />
                      Settings
                    </button>
                  </div>

                  <div className="border-t border-slate-100 my-1" />

                  {/* Logout Action */}
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 sm:px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={15} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}