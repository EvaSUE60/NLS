// app/page.tsx
"use client";

import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  CalendarCheck,
  Lock,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-[#ECF4EE] text-[#0C0D0D]">
      {/* Ambient background lighting & glowing blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[15%] top-[-10%] h-[500px] w-[500px] rounded-full bg-white/80 blur-3xl" />
        <div className="absolute right-[10%] top-[40%] h-[450px] w-[450px] rounded-full bg-[#0C0D0D]/5 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[30%] h-[500px] w-[500px] rounded-full bg-[#d2e5d7]/60 blur-3xl" />

        {/* Floating decorative particles */}
        <span className="absolute left-[12%] top-[25%] h-2 w-2 animate-ping rounded-full bg-[#0C0D0D]/20" />
        <span className="absolute right-[15%] top-[20%] h-1.5 w-1.5 animate-pulse rounded-full bg-[#0C0D0D]/30" />
        <span className="absolute bottom-[30%] left-[20%] h-2 w-2 rounded-full bg-[#d2e5d7]" />
        <span className="absolute bottom-[20%] right-[25%] h-1.5 w-1.5 animate-pulse rounded-full bg-[#0C0D0D]/20" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-1 items-center justify-center px-6 py-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          
          {/* Top Pill Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d2e5d7] bg-white/90 px-5 py-2 shadow-xs backdrop-blur-md transition-all hover:scale-105">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#0C0D0D] text-[#ECF4EE]">
              <Sparkles className="h-3 w-3 text-[#ECF4EE]" /> Official Portal
            </span>
            <span className="text-xs font-bold tracking-wider text-[#0C0D0D]">
              NLS 2026
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-black tracking-tight text-[#0C0D0D] sm:text-6xl lg:text-7xl leading-[1.1]">
            National Leadership Summit
          </h1>

          {/* Subheading / Accent */}
          <p className="mt-4 text-sm font-extrabold tracking-widest uppercase text-[#0C0D0D]/60 sm:text-base">
            Event Management Platform
          </p>

          {/* Description */}
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[#0C0D0D]/70 font-medium sm:text-base">
            Streamlined participant accommodation, room allocations, session attendance tracking, seminar registration, and group management during NLS 2026.
          </p>

          {/* CTA Group */}
          <div className="mt-10 flex w-full flex-col justify-center gap-4 sm:w-auto sm:flex-row">
            <Link
              href="/student"
              className="group flex items-center justify-center gap-3 rounded-2xl bg-[#0C0D0D] px-8 py-4 text-xs font-bold text-[#ECF4EE] shadow-md transition-all hover:bg-[#0C0D0D]/90 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Student Lookup</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>

            
          </div>

          {/* Feature Badges Grid */}
          <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4 w-full max-w-3xl">
            <FeatureCard icon={Building2} label="Room Allocations" />
            <FeatureCard icon={CalendarCheck} label="Attendance Records" />
            <FeatureCard icon={Users} label="Small Groups" />
            <FeatureCard icon={ShieldCheck} label="Secure Access" />
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#d2e5d7] bg-white/40 backdrop-blur-md px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row text-center sm:text-left">
          <div>
            <p className="text-xs font-bold text-[#0C0D0D]">
              National Leadership Summit Management System
            </p>
            <p className="text-[11px] font-medium text-[#0C0D0D]/50 mt-0.5">
              Powered by EvaSUE
            </p>
          </div>

          <div className="flex items-center gap-6">
            
            <Link
              href="/login"
              className="text-xs font-bold text-[#0C0D0D]/70 hover:text-[#0C0D0D] transition-colors"
            >
              Staff
            </Link>
            <span className="rounded-full bg-[#ECF4EE] border border-[#d2e5d7] px-2.5 py-1 text-[10px] font-mono font-bold text-[#0C0D0D]/60">
              v1.0.0
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* Reusable Feature Mini-Card */
function FeatureCard({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#d2e5d7] bg-white/70 p-3 shadow-2xs backdrop-blur-md">
      <Icon className="h-4 w-4 text-[#0C0D0D]" />
      <span className="text-[11px] font-bold text-[#0C0D0D]">{label}</span>
    </div>
  );
}