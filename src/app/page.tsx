"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#135574] text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/5 blur-3xl" />

        {/* Decorative circles */}
        <span className="absolute left-[10%] top-[30%] h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff5b68]" />
        <span className="absolute right-[12%] top-[22%] h-1 w-1 animate-pulse rounded-full bg-[#ff5b68]" />
        <span className="absolute bottom-[25%] left-[18%] h-1 w-1 rounded-full bg-sky-400" />
        <span className="absolute bottom-[30%] right-[20%] h-1.5 w-1.5 rounded-full bg-sky-400" />
      </div>

      {/* Hero */}
      <section className="relative z-10 flex flex-1 items-center justify-center px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">

          {/* Small label */}
          <div className="mb-8 animate-fade-in rounded-full border border-white/15 bg-white/5 px-6 py-2 backdrop-blur-sm">
            <p className="text-xs font-bold tracking-[0.35em] text-[#ff6470] sm:text-sm">
              EVASUE ETHIOPIA
            </p>
          </div>

          {/* Main heading */}
          <h1 className="animate-fade-up text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            National Leadership Summit
          </h1>

          {/* NLS */}
          <div className="mt-5 flex items-center gap-5">
            <span className="hidden h-px w-20 bg-gradient-to-r from-transparent to-[#ff5b68] sm:block" />

            <h2 className="text-2xl font-extrabold text-[#ff5b68] sm:text-4xl">
              NLS 2026
            </h2>

            <span className="hidden h-px w-20 bg-gradient-to-l from-transparent to-[#ff5b68] sm:block" />
          </div>

          {/* Description */}
          <p className="mt-8 max-w-3xl text-base leading-8 text-white/85 sm:text-lg">
            Event Management System for participant accommodation, attendance,
            seminar management, and group coordination during the National
            Leadership Summit.
          </p>

          {/* Buttons */}
          <div className="mt-10 flex w-full flex-col justify-center gap-4 sm:w-auto sm:flex-row">

            <Link
              href="/login"
              className="group flex min-w-[220px] items-center justify-center gap-3 rounded-xl bg-[#ed2529] px-7 py-4 font-bold text-white shadow-lg shadow-red-900/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#ff3438] hover:shadow-xl hover:shadow-red-900/30"
            >
              <span>Staff & Admin Login</span>

              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>

            <Link
              href="/student"
              className="group flex min-w-[220px] items-center justify-center gap-3 rounded-xl border border-white/25 bg-white/5 px-7 py-4 font-bold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-300/70 hover:bg-white/10"
            >
              <span>Student Lookup</span>

              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>

          {/* Bottom decoration */}
          <div className="mt-14 flex w-full max-w-sm items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-white/20" />

            <div className="h-2.5 w-2.5 rounded-full border-2 border-[#ff5b68]" />

            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-white/20" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 px-6 py-7">
        <div className="mx-auto text-center">
          <p className="text-sm text-sky-300">
            National Leadership Summit Management System
          </p>

          <p className="mt-2 text-xs text-sky-300/70">
            Version 1.0.0
          </p>
        </div>
      </footer>
    </main>
  );
}