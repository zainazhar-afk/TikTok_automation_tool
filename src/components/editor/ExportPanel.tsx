"use client";

import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { exportEditedVideo } from "@/lib/ffmpeg";
import { formatDuration } from "@/lib/videoUtils";
import { useEditorStore } from "@/store/editorStore";

export function ExportPanel() {
  const state = useEditorStore();
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadName, setDownloadName] = useState("final-clip.mp4");
  const [error, setError] = useState("");

  const clipDuration = useMemo(
    () => Math.max(state.trimEnd - state.trimStart, 0),
    [state.trimEnd, state.trimStart]
  );

  async function handleExport() {
    setError("");
    setDownloadUrl("");

    if (!state.selectedVideoBlob) {
      setError("Choose a local video before exporting.");
      return;
    }

    state.setExporting(true);
    state.setExportProgress(0);

    try {
      const blob = await exportEditedVideo({
        inputBlob: state.selectedVideoBlob,
        trimStart: state.trimStart,
        trimEnd: state.trimEnd,
        speed: state.speed,
        brightness: state.brightness,
        contrast: state.contrast,
        saturation: state.saturation,
        aspectRatio: state.aspectRatio,
        volume: state.volume,
        muted: state.muted,
        textOverlay: state.textOverlay,
        subtitles: state.subtitles.map(({ id: _id, ...subtitle }) => subtitle),
        onProgress: state.setExportProgress
      });

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setDownloadName(blob.type.includes("webm") ? "final-clip.webm" : "final-clip.mp4");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Export failed.");
    } finally {
      state.setExporting(false);
    }
  }

  return (
    <section className="space-y-4 rounded-lg border border-studio-400/20 bg-studio-500/[0.08] p-4">
      <div>
        <h3 className="text-sm font-semibold text-white">Export</h3>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          Clip length: {formatDuration(clipDuration)}. MP4 is attempted first, with WebM fallback.
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-950">
        <div
          className="h-full rounded-full bg-studio-mint transition-all"
          style={{ width: `${state.exportProgress}%` }}
        />
      </div>
      <Button className="w-full" onClick={handleExport} disabled={state.isExporting || !state.selectedVideoBlob}>
        {state.isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {state.isExporting ? "Exporting" : "Export MP4"}
      </Button>
      {downloadUrl ? (
        <a
          href={downloadUrl}
          download={downloadName}
          className="flex h-10 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-400/[0.12] text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/[0.18]"
        >
          Download final clip
        </a>
      ) : null}
      {error ? <ErrorMessage message={error} /> : null}
    </section>
  );
}
