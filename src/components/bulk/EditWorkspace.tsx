"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckSquare,
  Loader2,
  Play,
  RefreshCw,
  Square
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/common/Button";
import { EditSidebar } from "@/components/bulk/EditSidebar";
import { VideoCard } from "@/components/bulk/VideoCard";
import { processQueueItem } from "@/lib/bulkProcessor";
import { useBulkStore } from "@/store/bulkStore";
import type { BulkPreset } from "@/types/bulk";

type EditWorkspaceProps = {
  ffmpegStatus: "idle" | "loading" | "ready" | "error";
  ffmpegError: string | null;
  onRetryFfmpeg: () => void;
};

export function EditWorkspace({
  ffmpegStatus,
  ffmpegError,
  onRetryFfmpeg
}: EditWorkspaceProps) {
  const downloadedVideos = useBulkStore((s) => s.downloadedVideos);
  const selectedVideoIds = useBulkStore((s) => s.selectedVideoIds);
  const videoPresets = useBulkStore((s) => s.videoPresets);
  const selectAll = useBulkStore((s) => s.selectAll);
  const clearSelection = useBulkStore((s) => s.clearSelection);
  const updatePerVideoResult = useBulkStore((s) => s.updatePerVideoResult);
  const resetPerVideoResult = useBulkStore((s) => s.resetPerVideoResult);

  const videoIds = [...downloadedVideos.keys()];
  const allSelected = videoIds.length > 0 && selectedVideoIds.size === videoIds.length;
  const selectedDownloaded = videoIds.filter((id) => selectedVideoIds.has(id));

  function toggleSelectAll() {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll(videoIds);
    }
  }

  async function handleProcessSelected() {
    if (ffmpegStatus !== "ready") return;

    for (const videoId of selectedDownloaded) {
      const downloaded = downloadedVideos.get(videoId);
      if (!downloaded) continue;

      const preset = videoPresets.get(videoId) ?? defaultPreset;

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
        preset: { ...preset },
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
      }
    }
  }

  return (
    <div className="flex h-[calc(100vh-72px)] overflow-hidden">
      {/* Left sidebar */}
      <EditSidebar />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8">
          {/* FFmpeg status banners */}
          {ffmpegStatus === "loading" ? (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-blue-400/20 bg-blue-400/[0.06] px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
              <p className="text-sm text-blue-200">
                Loading video processor...
              </p>
            </div>
          ) : null}

          {ffmpegStatus === "error" ? (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-400/20 bg-red-400/[0.06] px-4 py-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-red-200">
                  {ffmpegError ?? "Video processor failed to load."}
                </p>
                <button
                  onClick={onRetryFfmpeg}
                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-red-300 transition hover:text-red-200"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
              </div>
            </div>
          ) : null}

          {/* Top bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/bulk"
                className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Browse
              </Link>
              <span className="text-sm text-slate-500">
                {videoIds.length} video{videoIds.length !== 1 ? "s" : ""}
                {selectedDownloaded.length > 0 ? (
                  <span className="ml-1 text-studio-400">
                    ({selectedDownloaded.length} selected)
                  </span>
                ) : null}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {videoIds.length > 0 ? (
                <button
                  onClick={toggleSelectAll}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                >
                  {allSelected ? (
                    <Square className="h-3.5 w-3.5" />
                  ) : (
                    <CheckSquare className="h-3.5 w-3.5" />
                  )}
                  {allSelected ? "Deselect All" : "Select All"}
                </button>
              ) : null}

              <Button
                size="sm"
                onClick={handleProcessSelected}
                disabled={
                  selectedDownloaded.length === 0 ||
                  ffmpegStatus !== "ready"
                }
              >
                <Play className="h-4 w-4" />
                Process Selected ({selectedDownloaded.length})
              </Button>
            </div>
          </div>

          {/* Card grid */}
          {videoIds.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-sm font-medium text-slate-400">
                No videos loaded
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Go back to Browse to select and download YouTube Shorts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videoIds.map((id) => (
                <VideoCard key={id} videoId={id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
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
