// src/app/(dashboard)/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-lg">Loading dashboard...</div>
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Welcome, {user.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                Logged in as: <span className="font-medium">{user.email}</span>
              </p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Role Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Your Role
          </h2>
          <div className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">
            {user.role.toUpperCase()}
          </div>

          {/* Role-specific info */}
          {user.role === 'super_admin' && (
            <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-purple-700">🔑 You have super admin privileges</p>
            </div>
          )}
          {user.role === 'admin' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-700">🛠️ You have admin privileges</p>
            </div>
          )}
          {user.role === 'staff' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700">👤 You have staff privileges</p>
            </div>
          )}
        </div>

        {/* Login Success Message */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-700">✅ Login successful! You are now authenticated.</p>
          <p className="text-sm text-green-600 mt-1">
            User ID: {user.user_id}
          </p>
          <p className="text-sm text-green-600">
            Email: {user.email}
          </p>
        </div>
      </div>
    </div>
  );
}