"use client";

import { useEditorStore } from "@/store/editorStore";

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function SpeedControls() {
  const { speed, setSpeed } = useEditorStore();

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-white">Speed</h3>
      <div className="grid grid-cols-3 gap-2">
        {speeds.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setSpeed(value)}
            className={`h-9 rounded-lg border text-sm font-semibold transition ${
              speed === value
                ? "border-studio-400 bg-studio-500 text-white"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
            }`}
          >
            {value}x
          </button>
        ))}
      </div>
    </section>
  );
}
