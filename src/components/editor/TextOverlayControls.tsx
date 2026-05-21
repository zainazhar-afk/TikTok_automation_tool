"use client";

import { AlignCenter, AlignEndVertical, AlignStartVertical } from "lucide-react";
import type { ComponentType } from "react";
import { Input } from "@/components/common/Input";
import { useEditorStore } from "@/store/editorStore";
import type { TextOverlayPosition } from "@/types/editor";

const positions: Array<{
  value: TextOverlayPosition;
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { value: "top", label: "Top", icon: AlignStartVertical },
  { value: "center", label: "Center", icon: AlignCenter },
  { value: "bottom", label: "Bottom", icon: AlignEndVertical }
];

export function TextOverlayControls() {
  const { textOverlay, setTextOverlay } = useEditorStore();

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-white">Text Overlay</h3>
      <label className="text-xs font-medium text-slate-400">
        Text
        <Input
          className="mt-1"
          value={textOverlay.text}
          onChange={(event) => setTextOverlay({ text: event.target.value })}
          placeholder="Hook text"
        />
      </label>
      <label className="block text-xs font-medium text-slate-400">
        <span className="flex justify-between">
          Font size
          <span className="text-slate-300">{textOverlay.fontSize}px</span>
        </span>
        <input
          className="mt-2 w-full"
          type="range"
          min={24}
          max={96}
          step={1}
          value={textOverlay.fontSize}
          onChange={(event) => setTextOverlay({ fontSize: Number(event.target.value) })}
        />
      </label>
      <label className="flex items-center justify-between gap-3 text-xs font-medium text-slate-400">
        Color
        <input
          type="color"
          value={textOverlay.color}
          onChange={(event) => setTextOverlay({ color: event.target.value })}
          className="h-10 w-14 rounded border border-white/10 bg-slate-950"
        />
      </label>
      <div className="grid grid-cols-3 gap-2">
        {positions.map((position) => {
          const Icon = position.icon;
          return (
            <button
              key={position.value}
              type="button"
              title={position.label}
              onClick={() => setTextOverlay({ position: position.value })}
              className={`flex h-10 items-center justify-center rounded-lg border transition ${
                textOverlay.position === position.value
                  ? "border-studio-400 bg-studio-500 text-white"
                  : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
