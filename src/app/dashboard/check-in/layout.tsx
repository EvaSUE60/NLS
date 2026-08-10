// src/app/dashboard/check-in/layout.tsx
'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Sparkles, Menu, X } from 'lucide-react';
import { ProtectedRoute } from '@/src/components/shared/ProtectedRoute';
import { useAuth } from '@/src/hooks/useAuth';

function CheckInLayout({ children }: { children: ReactNode }) {
  const { isLoading, user, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ✅ Ensure only staff and admins can access this page
  useEffect(() => {
    if (!isLoading && user) {
      // If user is not staff or admin, redirect to dashboard
      if (user.role !== 'staff' && user.role !== 'admin' && user.role !== 'super_admin') {
        router.replace('/dashboard');
      }
    }
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">Loading check-in system...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'staff']}>
      <div className="min-h-screen bg-[#FAFAFA]">
        {/* Header */}
        <header className="bg-white border-b border-[#ECF4EE] px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Sparkles className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-[#0C0D0D] tracking-tight">
                NLS 2026 Check-in
              </h1>
              <p className="text-[10px] font-medium text-[#0C0D0D]/50 hidden sm:block">
                {user?.role === 'staff' ? 'Staff Check-in Portal' : 'Admin Check-in Portal'}
              </p>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs text-[#0C0D0D]/60">
              <User className="h-4 w-4" />
              <span className="font-medium">{user?.name || user?.email || 'User'}</span>
              <span className="px-2 py-0.5 rounded-full bg-[#ECF4EE] text-[10px] font-bold text-emerald-700 uppercase">
                {user?.role || 'Staff'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-all text-xs font-bold border border-rose-200 hover:border-rose-300"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden p-2 rounded-xl hover:bg-[#ECF4EE] transition-colors"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 text-[#0C0D0D]" />
            ) : (
              <Menu className="h-5 w-5 text-[#0C0D0D]" />
            )}
          </button>
        </header>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="sm:hidden bg-white border-b border-[#ECF4EE] p-4 shadow-lg">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-[#0C0D0D]">
                <User className="h-4 w-4" />
                <span className="font-medium">{user?.name || user?.email || 'User'}</span>
                <span className="px-2 py-0.5 rounded-full bg-[#ECF4EE] text-[10px] font-bold text-emerald-700 uppercase">
                  {user?.role || 'Staff'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-all text-sm font-bold border border-rose-200"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="p-4">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default CheckInLayout;