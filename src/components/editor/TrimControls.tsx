"use client";

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { formatDuration } from "@/lib/videoUtils";
import { useEditorStore } from "@/store/editorStore";

export function TrimControls({ duration }: { duration: number }) {
  const { trimStart, trimEnd, setTrimStart, setTrimEnd } = useEditorStore();
  const clipDuration = Math.max(trimEnd - trimStart, 0);

  function setClipLength(length: number) {
    const nextEnd = Math.min(trimStart + length, duration || trimStart + length);
    setTrimEnd(nextEnd);
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-white">Trim</h3>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-slate-400">
          Start time
          <Input
            className="mt-1"
            type="number"
            min={0}
            step={0.1}
            value={trimStart}
            onChange={(event) => setTrimStart(Number(event.target.value))}
          />
        </label>
        <label className="text-xs font-medium text-slate-400">
          End time
          <Input
            className="mt-1"
            type="number"
            min={0}
            step={0.1}
            value={trimEnd}
            onChange={(event) => setTrimEnd(Number(event.target.value))}
          />
        </label>
      </div>
      <div className="rounded-lg bg-slate-950/55 p-3 text-sm text-slate-300">
        Duration preview: <span className="font-semibold text-white">{formatDuration(clipDuration)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[15, 30, 60].map((length) => (
          <Button key={length} variant="secondary" size="sm" onClick={() => setClipLength(length)}>
            {length}s
          </Button>
        ))}
      </div>
    </section>
  );
}
