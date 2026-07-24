import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  id,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-semibold text-sky-100"
        >
          {label}
        </label>
      )}

      <input
        id={id}
        className={`w-full rounded-lg border bg-[#115a7c] px-4 py-3 text-white outline-none transition placeholder:text-sky-300/60 ${
          error
            ? "border-red-400 focus:border-red-400"
            : "border-white/10 focus:border-sky-300"
        } ${className}`}
        {...props}
      />

      {error && (
        <p className="mt-2 text-sm text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}