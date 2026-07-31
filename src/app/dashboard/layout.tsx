// src/app/dashboard/layout.tsx
'use client';

import { ReactNode } from 'react';
import { Sidebar } from '@/src/components/dashboard/Sidebar';
import { Header } from '@/src/components/dashboard/Header';
import { ProtectedRoute } from '@/src/components/shared/ProtectedRoute';
import { useAuth } from '@/src/hooks/useAuth';
import { usePathname } from 'next/navigation';

function DashboardLayoutWrapper({ children }: { children: ReactNode }) {
  const { isLoading, user } = useAuth();
  const pathname = usePathname();

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

  // Check if user is staff and on the check-in page
  const isStaff = user?.role === 'staff';
  const isCheckInPage = pathname === '/dashboard/check-in';
  const showSidebar = !(isStaff && isCheckInPage);
  const showHeader = !(isStaff && isCheckInPage);

  return (
    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'staff']}>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar - Fixed on the left */}
        {showSidebar && (
          <div className="hidden md:block h-full flex-shrink-0">
            <Sidebar />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {showHeader && <Header />}
          <main className={`flex-1 overflow-y-auto ${showHeader ? 'p-4 md:p-6' : 'p-0'}`}>
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default DashboardLayoutWrapper;