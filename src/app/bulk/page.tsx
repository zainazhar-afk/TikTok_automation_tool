"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { TrendingVideosGrid } from "@/components/bulk/TrendingVideosGrid";
import { BulkEditPanel } from "@/components/bulk/BulkEditPanel";
import { ExportQueue } from "@/components/bulk/ExportQueue";
import { Button } from "@/components/common/Button";
import { processQueueItem } from "@/lib/bulkProcessor";
import { loadFFmpeg } from "@/lib/ffmpeg";
import { useBulkStore } from "@/store/bulkStore";

export default function BulkPage() {
  const router = useRouter();
  const queue = useBulkStore((s) => s.queue);
  const downloadedVideos = useBulkStore((s) => s.downloadedVideos);
  const updateQueueItem = useBulkStore((s) => s.updateQueueItem);
  const setProcessing = useBulkStore((s) => s.setProcessing);
  const isProcessing = useBulkStore((s) => s.isProcessing);
  const ffmpegStatus = useBulkStore((s) => s.ffmpegStatus);
  const ffmpegError = useBulkStore((s) => s.ffmpegError);
  const setFFmpegStatus = useBulkStore((s) => s.setFFmpegStatus);
  const setFFmpegError = useBulkStore((s) => s.setFFmpegError);

  const hasDownloadedVideos = downloadedVideos.size > 0;

  useEffect(() => {
    let cancelled = false;
    setFFmpegStatus("loading");
    setFFmpegError(null);

    loadFFmpeg()
      .then(() => {
        if (!cancelled) setFFmpegStatus("ready");
      })
      .catch((err) => {
        if (!cancelled) {
          setFFmpegStatus("error");
          setFFmpegError(
            err instanceof Error ? err.message : "FFmpeg failed to load."
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleRetryFfmpeg() {
    setFFmpegStatus("loading");
    setFFmpegError(null);

    loadFFmpeg()
      .then(() => setFFmpegStatus("ready"))
      .catch((err) => {
        setFFmpegStatus("error");
        setFFmpegError(
          err instanceof Error ? err.message : "FFmpeg failed to load."
        );
      });
  }

  async function handleProcessAll() {
    if (isProcessing) return;
    setProcessing(true);

    // Process items sequentially
    const items = useBulkStore.getState().queue;

    for (const item of items) {
      // Skip items that are already done or not waiting (unless retrying)
      if (item.status !== "waiting") continue;

      const blob = downloadedVideos.get(item.videoId)?.blob;
      if (!blob) {
        updateQueueItem(item.id, {
          status: "failed",
          error: "Video not downloaded. Remove and re-download."
        });
        continue;
      }

      try {
        // Step 1: Analysis
        if (item.preset.autoBestSegment) {
          updateQueueItem(item.id, { status: "analyzing", progress: 0 });
        }

        // Step 2: Process
        const exported = await processQueueItem(item, blob ?? null, (progress) => {
          updateQueueItem(item.id, {
            status: "exporting",
            progress
          });
        });

        if (!item.preset.autoBestSegment) {
          updateQueueItem(item.id, { status: "exporting", progress: 0 });
        }

        // Step 3: Create download
        const url = URL.createObjectURL(exported);
        const ext = exported.type.includes("webm") ? "webm" : "mp4";
        const safeName = item.videoName.replace(/[<>:"/\\|?*]+/g, "_").slice(0, 60);

        updateQueueItem(item.id, {
          status: "done",
          progress: 100,
          downloadUrl: url,
          downloadName: `clip_${safeName}.${ext}`
        });
      } catch (caught) {
        updateQueueItem(item.id, {
          status: "failed",
          error:
            caught instanceof Error ? caught.message : "Processing failed."
        });
      }
    }

    setProcessing(false);
  }

  return (
    <main className="flex min-h-[calc(100vh-72px)]">
      <BulkEditPanel />
      <div className="min-w-0 flex-1 px-6 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-studio-400">
              Bulk Editor
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-normal text-white">
              Edit YouTube Shorts in bulk
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
              Browse YouTube Shorts by niche, download the ones you want, configure
              editing settings in the sidebar, and process them all through the export
              queue.
            </p>
          </div>

          <TrendingVideosGrid />

          {hasDownloadedVideos ? (
            <div className="flex items-center justify-between rounded-xl border border-studio-500/30 bg-studio-500/[0.06] p-5">
              <div>
                <p className="text-sm font-semibold text-white">
                  {downloadedVideos.size} video{downloadedVideos.size !== 1 ? "s" : ""} ready
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Open the editing workspace to customize each video individually
                  or apply batch settings.
                </p>
              </div>
              <Button onClick={() => router.push("/bulk/edit")}>
                <ArrowRight className="h-4 w-4" />
                Next: Edit Videos
              </Button>
            </div>
          ) : null}

          <ExportQueue
            onProcessAll={handleProcessAll}
            ffmpegStatus={ffmpegStatus}
            ffmpegError={ffmpegError}
            onRetryFfmpeg={handleRetryFfmpeg}
          />
        </div>
      </div>
    </main>
  );
}
