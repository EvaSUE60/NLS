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
      className={`rounded-2xl border border-white/10 bg-[#176384] p-8 shadow-xl ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}