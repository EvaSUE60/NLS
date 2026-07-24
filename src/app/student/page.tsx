"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";

export default function StudentLookupPage() {
  const router = useRouter();

  const [nlsId, setNlsId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const studentId = nlsId.trim();

    if (!studentId) {
      setError("Please enter your NLS ID.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // Later we can validate the ID with your backend here.

      router.push(`/student/${encodeURIComponent(studentId)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#135574] px-5 text-white">
      
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        {/* Blue glow */}
        <div className="absolute left-[10%] top-[10%] h-[400px] w-[400px] rounded-full bg-sky-400/20 blur-[120px]" />

        {/* Red glow */}
        <div className="absolute bottom-[5%] right-[10%] h-[350px] w-[350px] rounded-full bg-[#ed2529]/15 blur-[120px]" />

        {/* Center glow */}
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/10 blur-[150px]" />

        {/* Small decorative dots */}
        <span className="absolute left-[15%] top-[25%] h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff5b68]" />

        <span className="absolute right-[18%] top-[20%] h-1 w-1 animate-pulse rounded-full bg-sky-300" />

        <span className="absolute bottom-[20%] left-[20%] h-1 w-1 rounded-full bg-sky-300" />

        <span className="absolute bottom-[25%] right-[20%] h-1.5 w-1.5 rounded-full bg-[#ff5b68]" />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        
        {/* Back */}
        <Link
          href="/"
          className="mb-7 inline-flex items-center gap-2 text-sm text-sky-200 transition duration-200 hover:-translate-x-1 hover:text-white"
        >
          <span>←</span>
          <span>Back to Home</span>
        </Link>

        {/* Glass Card */}
        <Card className="border-white/15 bg-white/10 shadow-2xl backdrop-blur-xl">
          
          {/* Header */}
          <div className="text-center">
            <p className="mb-3 text-xs font-bold tracking-[0.3em] text-[#ff5b68]">
              NLS 2026
            </p>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Student Lookup
            </h1>

            <p className="mt-3 text-sm leading-6 text-sky-100/70">
              Enter your NLS ID to view your information
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="mt-8"
          >
            <Input
              id="nlsId"
              name="nlsId"
              label="NLS ID"
              type="text"
              placeholder="NLS-2026-001"
              value={nlsId}
              onChange={(e) => {
                setNlsId(e.target.value);
                setError("");
              }}
              error={error}
              autoComplete="off"
            />

            <Button
              type="submit"
              variant="danger"
              size="lg"
              isLoading={isLoading}
              disabled={!nlsId.trim()}
              className="mt-4 w-full bg-[#ed2529] text-white shadow-lg shadow-red-950/20 hover:bg-[#ff3438]"
            >
              <span>View My Information</span>

              <span className="ml-2">
                →
              </span>
            </Button>
          </form>

          {/* Bottom information */}
          <div className="mt-7 border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-sky-200/80">
              Example: NLS-2026-001
            </p>

            <p className="mt-2 text-xs text-sky-200/60">
              Your NLS ID is on your registration confirmation
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}