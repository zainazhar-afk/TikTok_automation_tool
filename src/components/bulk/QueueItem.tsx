"use client";

import { AlertCircle, CheckCircle2, Download, Loader2, RefreshCw, X } from "lucide-react";
import type { BulkQueueItem, QueueStatus } from "@/types/bulk";

type QueueItemProps = {
  item: BulkQueueItem;
  isProcessing: boolean;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
};

const badgeStyles: Record<QueueStatus, string> = {
  waiting: "bg-slate-700 text-slate-300",
  analyzing: "bg-blue-500/20 text-blue-300",
  exporting: "bg-yellow-500/20 text-yellow-300",
  done: "bg-emerald-500/20 text-emerald-300",
  failed: "bg-red-500/20 text-red-300"
};

const badgeLabels: Record<QueueStatus, string> = {
  waiting: "Waiting",
  analyzing: "Analyzing",
  exporting: "Exporting",
  done: "Done",
  failed: "Failed"
};

const progressColors: Record<string, string> = {
  analyzing: "bg-blue-400",
  exporting: "bg-yellow-400",
  done: "bg-emerald-400",
  failed: "bg-red-400"
};

export function QueueItem({ item, isProcessing, onRemove, onRetry }: QueueItemProps) {
  const progressColor =
    progressColors[item.status] ?? "bg-studio-500";
  const showProgress = item.status === "analyzing" || item.status === "exporting";
  const showRetry = item.status === "failed";
  const showDownload = item.status === "done" && item.downloadUrl;

  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-3 transition hover:border-white/[0.14]">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{item.videoName}</p>
          {item.error ? (
            <div>
              <p className="mt-0.5 truncate text-xs text-red-400">{item.error}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {item.error.includes("ffmpeg")
                  ? "Try refreshing the page or removing and re-adding this item."
                  : "Remove this item or click Retry."}
              </p>
            </div>
          ) : null}
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badgeStyles[item.status]}`}
        >
          {item.status === "done" ? <CheckCircle2 className="h-3 w-3" /> : null}
          {item.status === "failed" ? <AlertCircle className="h-3 w-3" /> : null}
          {(item.status === "analyzing" || item.status === "exporting") ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : null}
          {badgeLabels[item.status]}
        </span>

        <div className="flex items-center gap-1">
          {showDownload ? (
            <a
              href={item.downloadUrl!}
              download={item.downloadName ?? "clip.mp4"}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/[0.12] px-3 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/[0.18]"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          ) : null}
          {showRetry ? (
            <button
              onClick={() => onRetry(item.id)}
              disabled={isProcessing}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-yellow-400/30 bg-yellow-400/[0.12] px-3 text-xs font-semibold text-yellow-100 transition hover:bg-yellow-400/[0.18] disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          ) : null}
          <button
            onClick={() => onRemove(item.id)}
            disabled={isProcessing && item.status !== "failed"}
            className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showProgress ? (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ease-out ${progressColor}`}
              style={{ width: `${Math.min(item.progress, 100)}%` }}
            />
          </div>
          <span className="text-[11px] tabular-nums text-slate-500">
            {item.progress}%
          </span>
        </div>
      ) : null}
    </div>
  );
}
