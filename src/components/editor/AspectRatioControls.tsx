"use client";

import type { ComponentType } from "react";
import { RectangleHorizontal, RectangleVertical, Square } from "lucide-react";
import { useEditorStore } from "@/store/editorStore";
import type { AspectRatio } from "@/types/editor";

const ratios: Array<{ value: AspectRatio; label: string; icon: ComponentType<{ className?: string }> }> = [
  { value: "original", label: "Original", icon: RectangleHorizontal },
  { value: "9:16", label: "9:16 TikTok/Reels/Shorts", icon: RectangleVertical },
  { value: "1:1", label: "1:1 Square", icon: Square },
  { value: "16:9", label: "16:9 Landscape", icon: RectangleHorizontal }
];

export function AspectRatioControls() {
  const { aspectRatio, setAspectRatio } = useEditorStore();

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-white">Aspect Ratio</h3>
      <div className="grid gap-2">
        {ratios.map((ratio) => {
          const Icon = ratio.icon;
          return (
            <button
              key={ratio.value}
              type="button"
              onClick={() => setAspectRatio(ratio.value)}
              className={`flex h-10 items-center gap-3 rounded-lg border px-3 text-left text-sm font-semibold transition ${
                aspectRatio === ratio.value
                  ? "border-studio-400 bg-studio-500 text-white"
                  : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {ratio.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
