"use client";

import { formatDuration } from "@/lib/videoUtils";
import { useEditorStore } from "@/store/editorStore";

export function EditorTimeline({
  duration,
  currentTime
}: {
  duration: number;
  currentTime: number;
}) {
  const { trimStart, trimEnd } = useEditorStore();
  const safeDuration = Math.max(duration || trimEnd || 1, 1);
  const startPct = Math.min((trimStart / safeDuration) * 100, 100);
  const endPct = Math.min((trimEnd / safeDuration) * 100, 100);
  const currentPct = Math.min((currentTime / safeDuration) * 100, 100);

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-3 flex items-center justify-between text-sm text-slate-400">
        <span>Timeline</span>
        <span>
          {formatDuration(currentTime)} / {formatDuration(safeDuration)}
        </span>
      </div>
      <div className="relative h-14 rounded-lg bg-slate-950/80">
        <div
          className="absolute top-1/2 h-5 -translate-y-1/2 rounded bg-studio-500/35 ring-1 ring-studio-400/40"
          style={{
            left: `${startPct}%`,
            width: `${Math.max(endPct - startPct, 1)}%`
          }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-studio-mint"
          style={{
            left: `${currentPct}%`
          }}
        />
      </div>
      <div className="mt-3 flex justify-between text-xs text-slate-500">
        <span>Start {formatDuration(trimStart)}</span>
        <span>End {formatDuration(trimEnd)}</span>
      </div>
    </div>
  );
}
