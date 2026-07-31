"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, Loader2, Lock, Mail, Sparkles, ArrowRight } from "lucide-react";

import apiClient from "@/src/lib/api/client";

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      user_id: string;
      name: string;
      email: string;
      role: string;
    };
    accessToken: string;
    refreshToken: string;
  };
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await apiClient.post<LoginResponse>(
        "/auth/login",
        {
          email,
          password,
        }
      );

      const { accessToken, user } = response.data.data;

      // Store access token for authenticated API requests
      localStorage.setItem("accessToken", accessToken);

      // Store basic user information
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect based on user role
      // Staff → check-in page, Admin/Super Admin → dashboard
      if (user.role === "staff") {
        router.push("/dashboard/check-in");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#ECF4EE] px-4 py-8 text-[#0C0D0D]">
      {/* Ambient background blur circles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[15%] top-10 h-[300px] w-[300px] rounded-full bg-white/70 blur-3xl" />
        <div className="absolute bottom-10 right-[15%] h-[300px] w-[300px] rounded-full bg-emerald-100/50 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl border border-[#d2e5d7]/80 bg-white/90 p-6 sm:p-8 shadow-sm backdrop-blur-md"
        >
          {/* Header Badge & Titles */}
          <div className="text-center">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#ECF4EE] border border-[#d2e5d7] text-emerald-900 mb-3">
              <Sparkles className="w-3 h-3 text-emerald-700" /> NLS 2026 Portal
            </span>

            <h1 className="text-2xl font-black tracking-tight text-[#0C0D0D]">
              Welcome Back
            </h1>

            <p className="mt-1 text-xs font-semibold text-[#0C0D0D]/60">
              Staff & Admin Authentication
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-[#0C0D0D] mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-700" /> Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                autoComplete="email"
                className="w-full px-3.5 py-2.5 bg-white border border-[#d2e5d7] rounded-xl text-[#0C0D0D] placeholder-[#0C0D0D]/40 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 text-xs font-medium transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-[#0C0D0D] mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-700" /> Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 bg-white border border-[#d2e5d7] rounded-xl text-[#0C0D0D] placeholder-[#0C0D0D]/40 focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 text-xs font-medium transition-all"
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl py-2.5 px-4 text-xs font-bold transition-all disabled:opacity-50 shadow-2xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Account Creation Link */}
          <div className="mt-5 text-center pt-4 border-t border-[#ECF4EE]">
            <p className="text-xs text-[#0C0D0D]/60 font-semibold">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-bold text-emerald-800 hover:text-emerald-900 hover:underline transition"
              >
                Create Account
              </Link>
            </p>
          </div>

          {/* Footer Note */}
          <div className="mt-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#0C0D0D]/40">
              Staff and administrators only
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}