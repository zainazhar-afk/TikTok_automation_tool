"use client";

import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/common/Button";
import { useEditorStore } from "@/store/editorStore";

export function AudioControls() {
  const { volume, muted, setVolume, setMuted } = useEditorStore();

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-white">Audio</h3>
      <label className="block text-xs font-medium text-slate-400">
        <span className="flex justify-between">
          Volume
          <span className="text-slate-300">{Math.round(volume * 100)}%</span>
        </span>
        <input
          className="mt-2 w-full"
          type="range"
          min={0}
          max={2}
          step={0.01}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
        />
      </label>
      <Button variant={muted ? "primary" : "secondary"} size="sm" onClick={() => setMuted(!muted)}>
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        {muted ? "Muted" : "Mute"}
      </Button>
      <div className="rounded-lg border border-white/[0.08] bg-slate-950/45 p-3 text-xs text-slate-500">
        Pitch shift placeholder
      </div>
    </section>
  );
}
