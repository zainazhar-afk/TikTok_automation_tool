"use client";

import { useEffect } from "react";
import { EditWorkspace } from "@/components/bulk/EditWorkspace";
import { loadFFmpeg } from "@/lib/ffmpeg";
import { useBulkStore } from "@/store/bulkStore";

export default function BulkEditPage() {
  const ffmpegStatus = useBulkStore((s) => s.ffmpegStatus);
  const ffmpegError = useBulkStore((s) => s.ffmpegError);
  const setFFmpegStatus = useBulkStore((s) => s.setFFmpegStatus);
  const setFFmpegError = useBulkStore((s) => s.setFFmpegError);

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

  return (
    <EditWorkspace
      ffmpegStatus={ffmpegStatus}
      ffmpegError={ffmpegError}
      onRetryFfmpeg={handleRetryFfmpeg}
    />
  );
}
