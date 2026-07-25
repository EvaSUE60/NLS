"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const staffTypes = {
  dormitory: {
    label: "Dormitory Staff",
    icon: "🏠",
    description: "Manage rooms, beds and resident assignments.",
  },
  registration: {
    label: "Registration Staff",
    icon: "📝",
    description: "Manage participant registration and records.",
  },
  attendance: {
    label: "Attendance Staff",
    icon: "✅",
    description: "Manage attendance and participant check-ins.",
  },
  seminar: {
    label: "Seminar Staff",
    icon: "📚",
    description: "Manage seminar registration and attendance.",
  },
};

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [role, setRole] = useState<"staff" | "admin">("staff");

  const [staffType, setStaffType] =
    useState<keyof typeof staffTypes>("dormitory");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = () => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return score;
  };

  const strength = passwordStrength();

  const passwordsMatch =
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      console.log({
        fullName,
        email,
        role,
        staffType: role === "staff" ? staffType : null,
      });

      await new Promise((resolve) =>
        setTimeout(resolve, 1000)
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#135574] px-5 py-10 text-white">

      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0">

        <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-sky-400/15 blur-[140px]" />

        <div className="absolute -right-40 bottom-0 h-[450px] w-[450px] rounded-full bg-[#ed2529]/20 blur-[140px]" />

        <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/5 blur-[150px]" />

        {/* Floating particles */}
        <span className="absolute left-[10%] top-[20%] h-2 w-2 animate-pulse rounded-full bg-[#ff5b68]" />

        <span className="absolute right-[15%] top-[25%] h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300" />

        <span className="absolute bottom-[18%] left-[20%] h-1.5 w-1.5 animate-pulse rounded-full bg-sky-300" />

        <span className="absolute bottom-[30%] right-[8%] h-2 w-2 animate-pulse rounded-full bg-[#ff5b68]" />

      </div>

      <div className="relative z-10 w-full max-w-4xl">

        {/* Glass card */}
        <div className="rounded-3xl border border-white/15 bg-white/[0.08] p-7 shadow-2xl backdrop-blur-2xl transition-all duration-500 sm:p-10">

          {/* Header */}
          <div className="text-center">
<h1 className="mb-6 text-center text-4xl font-black tracking-tight sm:text-5xl">
  <span className="text-white">NLS </span>
  <span className="text-[#ff5b68]">2026</span>
</h1>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Create Account
            </h1>

            <p className="mt-3 text-sm text-sky-100/60">
              Join the National Leadership Summit management team
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-10"
          >

            <div className="grid gap-6 md:grid-cols-2">

              {/* Full name */}
              <Field label="Full Name">
                <input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setError("");
                  }}
                  className="input-style"
                />
              </Field>

              {/* Email */}
              <Field label="Email Address">
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  className="input-style"
                />
              </Field>

              {/* Password */}
              <Field label="Password">
                <div className="relative">

                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    className="input-style pr-20"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-sky-200/50 transition hover:text-white"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {/* Password strength */}
                {password && (
                  <div className="mt-3">

                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            strength >= level
                              ? strength <= 1
                                ? "bg-red-400"
                                : strength <= 2
                                  ? "bg-yellow-400"
                                  : "bg-green-400"
                              : "bg-white/10"
                          }`}
                        />
                      ))}
                    </div>

                    <p className="mt-2 text-xs text-sky-200/50">
                      {strength <= 1
                        ? "Weak password"
                        : strength === 2
                          ? "Medium password"
                          : "Strong password"}
                    </p>

                  </div>
                )}
              </Field>

              {/* Confirm password */}
              <Field label="Confirm Password">
                <div className="relative">

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setError("");
                    }}
                    className={`input-style pr-20 ${
                      confirmPassword
                        ? passwordsMatch
                          ? "!border-green-400/50"
                          : "!border-red-400/50"
                        : ""
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-sky-200/50 hover:text-white"
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

                {confirmPassword && (
                  <p
                    className={`mt-2 text-xs ${
                      passwordsMatch
                        ? "text-green-300"
                        : "text-red-300"
                    }`}
                  >
                    {passwordsMatch
                      ? "✓ Passwords match"
                      : "Passwords do not match"}
                  </p>
                )}
              </Field>

            </div>

            {/* Role selector */}
            <div className="mt-8">

              <p className="mb-3 text-sm font-semibold text-sky-100">
                Select Role
              </p>

              <div className="grid gap-3 sm:grid-cols-2">

                <button
                  type="button"
                  onClick={() => setRole("staff")}
                  className={`rounded-xl border p-4 text-left transition-all duration-300 ${
                    role === "staff"
                      ? "border-[#ff5b68]/70 bg-[#ff5b68]/15 shadow-lg"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <p className="font-bold">
                    👤 Staff
                  </p>

                  <p className="mt-1 text-xs text-sky-200/50">
                    Event operations and management
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`rounded-xl border p-4 text-left transition-all duration-300 ${
                    role === "admin"
                      ? "border-[#ff5b68]/70 bg-[#ff5b68]/15 shadow-lg"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <p className="font-bold">
                    🛡️ Admin
                  </p>

                  <p className="mt-1 text-xs text-sky-200/50">
                    Administrative access and control
                  </p>
                </button>

              </div>
            </div>

            {/* Staff type only appears for staff */}
            {role === "staff" && (
              <div className="mt-7">

                <label className="mb-2 block text-sm font-semibold text-sky-100">
                  Staff Type
                </label>

                <select
                  value={staffType}
                  onChange={(e) =>
                    setStaffType(
                      e.target
                        .value as keyof typeof staffTypes
                    )
                  }
                  className="input-style cursor-pointer"
                >
                  {Object.entries(staffTypes).map(
                    ([key, item]) => (
                      <option
                        key={key}
                        value={key}
                        className="bg-[#135574]"
                      >
                        {item.icon} {item.label}
                      </option>
                    )
                  )}
                </select>

             

              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-6 animate-pulse rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-[#ed2529] px-6 py-4 font-bold text-white shadow-lg shadow-red-950/30 transition-all duration-300 hover:-translate-y-1 hover:bg-[#ff3438] hover:shadow-xl disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account

                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                </>
              )}
            </button>

          </form>

          {/* Footer */}
          <div className="mt-8 border-t border-white/10 pt-6 text-center">

            <p className="text-sm text-sky-100/60">
              Already have an account?
            </p>

            <Link
              href="/login"
              className="mt-2 inline-block font-bold text-[#ff6b75] transition hover:text-white"
            >
              Sign In →
            </Link>

            <div>
              <Link
                href="/"
                className="mt-5 inline-block text-xs text-sky-200/50 transition hover:text-white"
              >
                ← Back to Home
              </Link>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-sky-100">
        {label}
      </label>

      {children}
    </div>
  );
}