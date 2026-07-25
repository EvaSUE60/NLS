"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import apiClient from "@/src/lib/api/client";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import Link from "next/link";
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

      // Go to protected dashboard
      router.push("/dashboard");
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
    
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#135574] px-5 text-white">

      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-sky-400/15 blur-[130px]" />

        <div className="absolute -right-32 bottom-10 h-[400px] w-[400px] rounded-full bg-[#ed2529]/15 blur-[130px]" />

        <div className="absolute left-1/2 top-1/2 h-[500px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/10 blur-[150px]" />
      </div>
{/* Background effects */}
<div className="pointer-events-none absolute inset-0 overflow-hidden">

  {/* Glow */}
  <div className="absolute -left-32 top-10 h-[420px] w-[420px] rounded-full bg-sky-400/15 blur-[130px]" />

  <div className="absolute -right-32 bottom-10 h-[400px] w-[400px] rounded-full bg-[#ed2529]/15 blur-[130px]" />

  {/* Particles */}
  <span className="absolute left-[10%] top-[18%] h-2 w-2 animate-pulse rounded-full bg-[#ff5b68]" />

  <span className="absolute left-[22%] top-[65%] h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300" />

  <span className="absolute right-[15%] top-[25%] h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff5b68]" />

  <span className="absolute right-[20%] bottom-[18%] h-2 w-2 animate-pulse rounded-full bg-sky-300" />

  <span className="absolute left-[48%] top-[10%] h-1 w-1 animate-pulse rounded-full bg-white/60" />

  <span className="absolute right-[40%] bottom-[12%] h-1 w-1 animate-pulse rounded-full bg-[#ff5b68]" />

</div>
      <div className="relative z-10 w-full max-w-md">
        {/* Glass card */}
        <div className="rounded-2xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-xl sm:p-10">

          {/* Header */}
          <div className="text-center">
           <h1 className="mb-6 text-center text-4xl font-black tracking-tight sm:text-5xl">
  <span className="text-white">NLS </span>
  <span className="text-[#ff5b68]">2026</span>
</h1>

            <h1 className="text-3xl font-black tracking-tight">
              Welcome Back
            </h1>

            <p className="mt-2 text-sm text-sky-100/70">
              Staff & Admin Login
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              autoComplete="email"
            />

            <Input
              id="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              autoComplete="current-password"
            />

            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="danger"
              size="lg"
              isLoading={isLoading}
              className="w-full bg-[#ed2529] text-white hover:bg-[#ff3438]"
            >
              Login →
            </Button>
          </form>
<div className="mt-7 text-center">
  <p className="text-sm text-slate-400">
    Don&apos;t have an account?
  </p>

  <Link
    href="/register"
   className="mt-2 inline-block font-bold text-[#ff5b68] transition hover:text-red-300"
  >
    Create Account →
  </Link>
</div>
          <div className="mt-7 border-t border-white/10 pt-6 text-center">
            <p className="text-xs text-sky-200/60">
              Staff and administrators only
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}