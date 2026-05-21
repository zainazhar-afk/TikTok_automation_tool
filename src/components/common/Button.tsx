import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary: "bg-studio-500 text-white hover:bg-blue-500 disabled:bg-slate-700",
  secondary:
    "border border-white/[0.12] bg-white/[0.05] text-slate-100 hover:bg-white/[0.09] disabled:bg-white/[0.03]",
  ghost: "text-slate-300 hover:bg-white/[0.07] disabled:text-slate-600",
  danger: "border border-red-400/30 bg-red-500/[0.12] text-red-100 hover:bg-red-500/20"
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base"
};

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-studio-400/70 disabled:cursor-not-allowed disabled:opacity-70 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
