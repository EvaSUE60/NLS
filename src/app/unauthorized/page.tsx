// src/app/unauthorized/page.tsx
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-500">Unauthorized</h1>
        <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
        <Link
          href="/dashboard"
          className="mt-4 inline-block rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}