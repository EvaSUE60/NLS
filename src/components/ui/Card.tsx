import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-8 shadow-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}