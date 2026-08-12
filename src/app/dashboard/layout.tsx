// src/app/dashboard/layout.tsx
'use client';

import { ReactNode } from 'react';
import { DashboardLayout } from '@/src/components/dashboard/DashboardLayout';
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

  // Special case for staff on check-in page
  const isStaff = user?.role === 'staff';
  const isCheckInPage = pathname === '/dashboard/check-in';
  
  if (isStaff && isCheckInPage) {
    return (
      <ProtectedRoute allowedRoles={['super_admin', 'admin', 'staff']}>
        <div className="flex h-screen overflow-hidden bg-gray-50">
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <main className="flex-1 overflow-y-auto p-0">
              {children}
            </main>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['super_admin', 'admin', 'staff']}>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default DashboardLayoutWrapper;