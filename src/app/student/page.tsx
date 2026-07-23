// src/app/student/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function StudentLookupPage() {
  const [nlsId, setNlsId] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nlsId.trim();
    
    if (!trimmed) {
      setError('Please enter your NLS ID');
      return;
    }
    
    if (!trimmed.startsWith('NLS-')) {
      setError('Invalid format. Use NLS-2026-XXX');
      return;
    }
    
    setError('');
    router.push(`/student/${trimmed}`);
  };

  return (
    <main className="min-h-screen bg-sky-900 text-white">
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md">
          {/* Back button */}
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-sky-300 transition hover:text-white"
          >
            ← Back to Home
          </Link>

          <div className="rounded-2xl bg-sky-800/50 p-8 backdrop-blur-sm">
            <div className="text-center">
              <h1 className="text-3xl font-bold">Student Lookup</h1>
              <p className="mt-2 text-sm text-sky-300">
                Enter your NLS ID to view your information
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="nlsId" className="block text-sm font-medium text-sky-200">
                  NLS ID
                </label>
                <input
                  id="nlsId"
                  type="text"
                  placeholder="NLS-2026-001"
                  value={nlsId}
                  onChange={(e) => {
                    setNlsId(e.target.value);
                    setError('');
                  }}
                  className="mt-1 block w-full rounded-lg bg-sky-900/50 px-4 py-3 text-white placeholder-sky-400 outline-none transition focus:ring-2 focus:ring-red-500"
                />
                {error && (
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-red-600 py-3 font-semibold transition hover:bg-red-700"
              >
                View My Information
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-sky-400">
              <p>Example: NLS-2026-001</p>
              <p className="mt-1">Your NLS ID is on your registration confirmation</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}