import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-white/10 bg-white/[0.045] shadow-soft ${className}`}
      {...props}
    />
  );
}
