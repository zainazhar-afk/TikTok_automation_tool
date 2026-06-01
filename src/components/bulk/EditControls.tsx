"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

// ── Section ────────────────────────────────────────────────────────

export function Section({
  label,
  icon,
  open,
  onToggle,
  children
}: {
  label: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/[0.05] bg-white/[0.02]">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <span className="text-slate-400">{icon}</span>
        <span className="flex-1 text-xs font-semibold text-white">
          {label}
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
        )}
      </button>
      {open ? (
        <div className="border-t border-white/[0.05] px-3 pb-3 pt-2.5">
          {children}
        </div>
      ) : null}
    </div>
  );
}

// ── Slider ─────────────────────────────────────────────────────────

export function Slider({
  label,
  min,
  max,
  value,
  onChange
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const displayValue = label === "Volume" ? `${value}%` : value;

  return (
    <label className="block">
      <span className="flex justify-between text-xs font-medium text-slate-400">
        {label}
        <span className="text-slate-500">{displayValue}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-studio-500"
      />
    </label>
  );
}

// ── PresetButton ───────────────────────────────────────────────────

export function PresetButton({
  label,
  detail,
  active,
  onClick
}: {
  label: string;
  detail: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
        active
          ? "border-studio-500 bg-studio-500/[0.12]"
          : "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12]"
      }`}
    >
      <span className="text-xs font-semibold text-white">{label}</span>
      <span className="mt-0.5 block text-[11px] text-slate-500">{detail}</span>
    </button>
  );
}

// ── Shared constants ───────────────────────────────────────────────

export const CLIP_LENGTHS = [15, 30, 60] as const;
export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;
export const FONT_SIZES = [24, 32, 42, 52, 64, 80] as const;
