// src/app/page.tsx

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-sky-900 text-white">
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-red-400">
            EvaSUE Ethiopia
          </p>

          <h1 className="text-5xl font-extrabold leading-tight">
            National Leadership Summit
          </h1>

          <p className="mt-2 text-2xl font-semibold text-red-400">
            NLS 2026
          </p>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-sky-100">
            Event Management System for participant accommodation,
            attendance, seminar management, and group coordination during
            the National Leadership Summit.
          </p>

          <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/login"
              className="rounded-lg bg-red-600 px-8 py-4 font-semibold transition hover:bg-red-700"
            >
              Staff & Admin Login
            </Link>

            <Link
              href="/student"
              className="rounded-lg border border-white/30 px-8 py-4 font-semibold transition hover:bg-white/10"
            >
              Student Lookup
            </Link>
          </div>

          <div className="mt-16 text-sm text-sky-300">
            National Leadership Summit Management System
          </div>

          <div className="mt-2 text-xs text-sky-400">
            Version 1.0.0
          </div>
        </div>
      </div>
    </main>
  );
}