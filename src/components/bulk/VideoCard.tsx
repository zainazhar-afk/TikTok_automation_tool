"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Download,
  Eye,
  Loader2,
  Play,
  RefreshCw,
  Square,
  X
} from "lucide-react";
import { VideoPreview } from "@/components/bulk/VideoPreview";
import { processQueueItem } from "@/lib/bulkProcessor";
import { useBulkStore } from "@/store/bulkStore";
import type { BulkPreset } from "@/types/bulk";

type VideoCardProps = {
  videoId: string;
};

export function VideoCard({ videoId }: VideoCardProps) {
  const selectedIds = useBulkStore((s) => s.selectedVideoIds);
  const downloadedVideos = useBulkStore((s) => s.downloadedVideos);
  const videoPresets = useBulkStore((s) => s.videoPresets);
  const perVideoResults = useBulkStore((s) => s.perVideoResults);
  const toggleVideo = useBulkStore((s) => s.toggleVideo);
  const removeDownloadedVideo = useBulkStore((s) => s.removeDownloadedVideo);
  const updatePerVideoResult = useBulkStore((s) => s.updatePerVideoResult);
  const resetPerVideoResult = useBulkStore((s) => s.resetPerVideoResult);

  const [showPreview, setShowPreview] = useState(false);
  const [processing, setProcessing] = useState(false);

  const downloaded = downloadedVideos.get(videoId);
  const isSelected = selectedIds.has(videoId);
  const result = perVideoResults.get(videoId);

  // Safe blob URL for thumbnail — use server-generated thumbnail if available
  const thumbnailUrl = useMemo(() => {
    if (!downloaded) return null;
    if (downloaded.tempId) {
      return `/api/videos/thumbnail/${downloaded.tempId}`;
    }
    if (downloaded.blob) {
      return URL.createObjectURL(downloaded.blob);
    }
    return null;
  }, [downloaded]);

  useEffect(() => {
    return () => {
      // Only revoke blob URLs, not API URLs
      if (thumbnailUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [thumbnailUrl]);

  if (!downloaded) return null;

  const preset = videoPresets.get(videoId) as BulkPreset | undefined;

  function settingsSummary() {
    if (!preset) return "Default";
    const parts: string[] = [];
    parts.push(`${preset.clipLength}s`);
    if (preset.speed !== 1) parts.push(`${preset.speed}x`);
    if (preset.aspectRatio !== "9:16") parts.push(preset.aspectRatio);
    if (preset.muted) parts.push("Muted");
    if (preset.brightness !== 0 || preset.contrast !== 0 || preset.saturation !== 0) {
      parts.push("Color");
    }
    if (preset.textOverlay.text) parts.push("Text");
    return parts.join(" \u00B7 ");
  }

  async function handleProcess() {
    if (processing || !downloaded) return;
    setProcessing(true);
    resetPerVideoResult(videoId);

    const effectivePreset = preset ?? defaultPreset;

    const syntheticItem: any = {
      id: videoId,
      videoId,
      videoName: downloaded.name,
      status: "waiting" as const,
      progress: 0,
      downloadUrl: null,
      downloadName: null,
      error: null,
      suggestedClip: null,
      preset: { ...effectivePreset },
      // Pass tempId so bulkProcessor can use server-side FFmpeg
      tempId: downloaded.tempId ?? undefined
    };

    try {
      updatePerVideoResult(videoId, { status: "analyzing", progress: 0 });

      const exported = await processQueueItem(
        syntheticItem,
        downloaded.blob ?? null,
        (progress) => {
          updatePerVideoResult(videoId, {
            status: progress < 50 ? "analyzing" : "exporting",
            progress
          });
        }
      );

      const downloadUrl = URL.createObjectURL(exported);
      const downloadName = downloaded.name.replace(/\.[^.]+$/, "") + "_clip.mp4";

      updatePerVideoResult(videoId, {
        status: "done",
        progress: 100,
        downloadUrl,
        downloadName
      });
    } catch (err) {
      updatePerVideoResult(videoId, {
        status: "failed",
        progress: 0,
        error: err instanceof Error ? err.message : "Processing error"
      });
    } finally {
      setProcessing(false);
    }
  }

  const isProcessing = processing || result?.status === "analyzing" || result?.status === "exporting";
  const isDone = result?.status === "done";
  const isFailed = result?.status === "failed";
  const progress = result?.progress ?? 0;

  const progressColor =
    isFailed ? "bg-red-500"
    : isDone ? "bg-emerald-400"
    : "bg-studio-500";

  return (
    <>
      {showPreview && downloaded ? (
        <VideoPreview
          blob={downloaded.blob}
          tempId={downloaded.tempId}
          name={downloaded.name}
          onClose={() => setShowPreview(false)}
        />
      ) : null}

      <div
        className={`group relative rounded-xl border transition ${
          isSelected
            ? "border-studio-500/60 bg-studio-500/[0.06]"
            : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14]"
        }`}
      >
        {/* Checkbox */}
        <button
          onClick={() => toggleVideo(videoId)}
          className={`absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-md border-2 transition ${
            isSelected
              ? "border-studio-500 bg-studio-500 text-white"
              : "border-white/30 bg-black/40 text-transparent hover:border-white/60"
          }`}
        >
          {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
        </button>

        {/* Thumbnail */}
        <div className="aspect-[9/16] overflow-hidden rounded-t-xl bg-slate-900">
          {thumbnailUrl ? (
            <video
              src={thumbnailUrl}
              className="h-full w-full object-cover"
              muted
              preload="metadata"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-3 space-y-2">
          <p className="truncate text-sm font-medium text-white" title={downloaded.name}>
            {downloaded.name}
          </p>

          {/* Settings summary */}
          <div className="flex flex-wrap gap-1">
            <span className="inline-flex items-center rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-slate-400">
              {settingsSummary()}
            </span>
          </div>

          {/* Progress bar */}
          {(isProcessing || isDone || isFailed) && !isDone ? (
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-[width] duration-500 ease-out ${progressColor}`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <span className="text-[11px] tabular-nums text-slate-500">
                {progress}%
              </span>
            </div>
          ) : null}

          {/* Error */}
          {isFailed && result?.error ? (
            <p className="text-xs text-red-400">{result.error}</p>
          ) : null}

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 pt-1">
            <button
              onClick={() => setShowPreview(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2.5 text-xs text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>

            {isDone ? (
              <a
                href={result!.downloadUrl!}
                download={result!.downloadName ?? "clip.mp4"}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.12] px-2.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/[0.18]"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </a>
            ) : (
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-studio-500/30 bg-studio-500/[0.12] px-2.5 text-xs font-semibold text-blue-100 transition hover:bg-studio-500/[0.18] disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isFailed ? (
                  <RefreshCw className="h-3.5 w-3.5" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                {isProcessing ? "Processing" : isFailed ? "Retry" : "Process"}
              </button>
            )}

            <button
              onClick={() => removeDownloadedVideo(videoId)}
              className="ml-auto inline-flex h-8 items-center gap-1 rounded-lg p-1.5 text-slate-500 transition hover:bg-red-400/[0.12] hover:text-red-400"
              title="Remove video"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

const defaultPreset: BulkPreset = {
  clipLength: 30,
  autoBestSegment: true,
  aspectRatio: "9:16",
  speed: 1,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  volume: 100,
  muted: false,
  textOverlay: {
    text: "",
    fontSize: 52,
    position: "bottom",
    color: "#ffffff"
  },
  subtitlePlaceholder: false,
  exportPreset: "tiktok"
};
