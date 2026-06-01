"use client";

import { AlertCircle, Loader2, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { QueueItem } from "@/components/bulk/QueueItem";
import { useBulkStore } from "@/store/bulkStore";

type ExportQueueProps = {
  onProcessAll: () => void;
  ffmpegStatus: "idle" | "loading" | "ready" | "error";
  ffmpegError: string | null;
  onRetryFfmpeg: () => void;
};

export function ExportQueue({
  onProcessAll,
  ffmpegStatus,
  ffmpegError,
  onRetryFfmpeg
}: ExportQueueProps) {
  const queue = useBulkStore((s) => s.queue);
  const isProcessing = useBulkStore((s) => s.isProcessing);
  const removeFromQueue = useBulkStore((s) => s.removeFromQueue);
  const retryItem = useBulkStore((s) => s.retryItem);

  const waitingCount = queue.filter((item) => item.status === "waiting").length;
  const doneCount = queue.filter((item) => item.status === "done").length;
  const processingCount = queue.filter(
    (item) => item.status === "analyzing" || item.status === "exporting"
  ).length;

  if (queue.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Export Queue</h2>
        <EmptyState
          title="No videos in the queue"
          body="Select and download trending videos, configure your editing settings, then click Add to Queue."
        />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {/* FFmpeg status banner */}
      {ffmpegStatus === "loading" ? (
        <div className="flex items-center gap-3 rounded-lg border border-blue-400/20 bg-blue-400/[0.06] px-4 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          <p className="text-sm text-blue-200">
            Loading video processor... this may take a few seconds on first visit.
          </p>
        </div>
      ) : null}

      {ffmpegStatus === "error" ? (
        <div className="flex items-start gap-3 rounded-lg border border-red-400/20 bg-red-400/[0.06] px-4 py-3">
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

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Export Queue</h2>
          <p className="mt-1 text-sm text-slate-400">
            {processingCount > 0
              ? `Processing ${doneCount + 1} of ${queue.length}`
              : doneCount > 0
                ? `${doneCount} of ${queue.length} completed`
                : `${queue.length} item${queue.length !== 1 ? "s" : ""} queued`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={onProcessAll}
            disabled={isProcessing || waitingCount === 0 || ffmpegStatus !== "ready"}
          >
            <Play className="h-4 w-4" />
            Process All
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {queue.map((item) => (
          <QueueItem
            key={item.id}
            item={item}
            isProcessing={isProcessing}
            onRemove={removeFromQueue}
            onRetry={retryItem}
          />
        ))}
      </div>
    </section>
  );
}
