// src/app/student/page.tsx
"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Search, Sparkles, Loader2, AlertCircle } from "lucide-react";

export default function StudentLookupPage() {
  const router = useRouter();

  const [nlsId, setNlsId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const studentId = nlsId.trim();

    if (!studentId) {
      setError("Please enter your NLS ID or number.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // ✅ If the input is just a number (e.g., "003"), construct the full NLS ID
      let fullNlsId = studentId;
      
      // Check if it's just a number (with or without leading zeros)
      if (/^\d+$/.test(studentId)) {
        // Pad with zeros to 3 digits
        const paddedNumber = studentId.padStart(3, '0');
        const year = new Date().getFullYear();
        fullNlsId = `NLS-${year}-${paddedNumber}`;
      } 
      // Check if it's already a full NLS ID format
      else if (/^NLS-\d{4}-\d{3}$/.test(studentId.toUpperCase())) {
        fullNlsId = studentId.toUpperCase();
      }
      // Check if it's a partial format like "NLS-2026-003"
      else if (/^NLS-\d{4}-\d+$/.test(studentId.toUpperCase())) {
        // Already has NLS prefix but might be missing padding
        const parts = studentId.toUpperCase().split('-');
        if (parts.length === 3) {
          const paddedNumber = parts[2].padStart(3, '0');
          fullNlsId = `${parts[0]}-${parts[1]}-${paddedNumber}`;
        }
      }

      router.push(`/student/${encodeURIComponent(fullNlsId)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#ECF4EE] px-5 py-12 text-[#0C0D0D]">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[10%] h-[400px] w-[400px] rounded-full bg-white/70 blur-3xl" />
        <div className="absolute bottom-[10%] right-[10%] h-[350px] w-[350px] rounded-full bg-[#0C0D0D]/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d2e5d7]/50 blur-3xl" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md">
        {/* Back Link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-[#0C0D0D]/70 transition-all duration-200 hover:-translate-x-1 hover:text-[#0C0D0D]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        {/* Card Container */}
        <div className="rounded-3xl border border-[#d2e5d7] bg-white/90 p-8 shadow-sm backdrop-blur-xl">
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#0C0D0D] text-[#ECF4EE]">
              <Sparkles className="w-3 h-3 text-[#ECF4EE]" /> NLS 2026
            </span>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0C0D0D]">
              Student Lookup
            </h1>

            <p className="text-xs text-[#0C0D0D]/60 font-medium">
              Enter your NLS ID or number to view your registration details
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label htmlFor="nlsId" className="block text-xs font-bold uppercase tracking-wider text-[#0C0D0D]">
                NLS ID or Number <span className="text-rose-500">*</span>
              </label>
              
              <div className="relative">
                <input
                  id="nlsId"
                  name="nlsId"
                  type="text"
                  placeholder="e.g., 003 or NLS-2026-003"
                  value={nlsId}
                  onChange={(e) => {
                    setNlsId(e.target.value);
                    setError("");
                  }}
                  autoComplete="off"
                  className={`w-full px-4 py-3 pl-10 rounded-2xl border ${
                    error
                      ? "border-rose-300 bg-rose-50/20 focus:ring-rose-500"
                      : "border-[#ECF4EE] bg-[#ECF4EE]/30 focus:border-[#0C0D0D]"
                  } text-xs font-semibold text-[#0C0D0D] focus:outline-none transition-all placeholder:text-[#0C0D0D]/40`}
                />
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#0C0D0D]/40" />
              </div>

              <div className="flex items-center gap-2 text-[10px] font-medium text-[#0C0D0D]/50">
                <span>Enter just the number (e.g., <strong className="font-bold text-[#0C0D0D]/70">003</strong>) or full ID</span>
              </div>

              {error && (
                <div className="flex items-center gap-1.5 mt-1 text-xs font-semibold text-rose-600">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !nlsId.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[#0C0D0D] text-[#ECF4EE] hover:bg-[#0C0D0D]/90 disabled:opacity-50 rounded-2xl py-3 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#ECF4EE]" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>View My Information</span>
                  <ArrowRight className="h-4 w-4 text-[#ECF4EE]" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Information */}
          <div className="mt-8 border-t border-[#ECF4EE] pt-6 text-center space-y-1">
            <p className="text-xs font-bold text-[#0C0D0D]/80">
              Example: <span className="font-mono text-[#0C0D0D]">003</span> or{" "}
              <span className="font-mono text-[#0C0D0D]">NLS-2026-003</span>
            </p>
            <p className="text-[11px] text-[#0C0D0D]/50 font-medium">
              Your NLS ID can be found on your registration confirmation email or badge.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}