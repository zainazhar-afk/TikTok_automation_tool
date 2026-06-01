"use client";

import { suggestBestClipFromBlob } from "@/lib/audioAnalysis";
import { exportEditedVideo } from "@/lib/ffmpeg";
import type { BulkQueueItem } from "@/types/bulk";

/**
 * Checks whether server-side native FFmpeg is available.
 * Returns false during SSR, or if the server doesn't have FFmpeg installed.
 */
let _serverFFmpegStatus: boolean | null = null;

export async function isServerFFmpegAvailable(): Promise<boolean> {
  if (_serverFFmpegStatus !== null) return _serverFFmpegStatus;

  try {
    const res = await fetch("/api/videos/ffmpeg-status");
    if (!res.ok) {
      _serverFFmpegStatus = false;
      return false;
    }
    const data = (await res.json()) as { available: boolean };
    _serverFFmpegStatus = data.available;
  } catch {
    _serverFFmpegStatus = false;
  }

  return _serverFFmpegStatus ?? false;
}

/**
 * Processes a video via the server-side native FFmpeg.
 * Sends the edit config to POST /api/videos/process and receives the processed video.
 */
export async function processOnServer(
  tempId: string,
  preset: BulkQueueItem["preset"],
  trimStart: number,
  trimEnd: number,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const res = await fetch("/api/videos/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      videoId: tempId,
      trimStart,
      trimEnd,
      speed: preset.speed,
      brightness: preset.brightness,
      contrast: preset.contrast,
      saturation: preset.saturation,
      aspectRatio: preset.aspectRatio,
      volume: preset.volume,
      muted: preset.muted,
      textOverlay: preset.textOverlay.text.trim() ? preset.textOverlay : undefined
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Server processing failed." }));
    throw new Error(err.error ?? "Server processing failed.");
  }

  // Report approximate progress — server doesn't stream progress yet
  if (onProgress) {
    onProgress(30);
    onProgress(60);
    onProgress(100);
  }

  return await res.blob();
}

/**
 * Processes a single queue item through the editing pipeline.
 * Uses server-side native FFmpeg if available and a tempId is provided,
 * otherwise falls back to client-side ffmpeg.wasm.
 * Returns the exported Blob on success or throws on failure.
 */
export async function processQueueItem(
  item: BulkQueueItem,
  blob: Blob | null,
  onProgress: (progress: number) => void
): Promise<Blob> {
  let trimStart: number = 0;
  let trimEnd: number = item.preset.clipLength;

  // Step 1: Auto-best-segment analysis (client-side only — needs the blob)
  if (item.preset.autoBestSegment && blob) {
    const suggestion = await suggestBestClipFromBlob(blob, {
      targetDuration: item.preset.clipLength
    });
    trimStart = suggestion.start;
    trimEnd = suggestion.end;
  }

  // Step 2: Export — try server-side first, fall back to client
  const serverAvailable = await isServerFFmpegAvailable();
  const tempId = (item as any).tempId as string | undefined;

  if (serverAvailable && tempId) {
    return processOnServer(tempId, item.preset, trimStart, trimEnd, onProgress);
  }

  // Client-side fallback
  if (!blob) {
    throw new Error("No video data available for client-side processing.");
  }

  const ffmpegBrightness = item.preset.brightness / 100;
  const ffmpegContrast = 1 + item.preset.contrast / 100;
  const ffmpegSaturation = 1 + item.preset.saturation / 100;
  const ffmpegVolume = item.preset.volume / 100;

  return exportEditedVideo({
    inputBlob: blob,
    trimStart,
    trimEnd,
    speed: item.preset.speed,
    brightness: ffmpegBrightness,
    contrast: ffmpegContrast,
    saturation: ffmpegSaturation,
    aspectRatio: item.preset.aspectRatio,
    volume: ffmpegVolume,
    muted: item.preset.muted,
    textOverlay: item.preset.textOverlay.text.trim()
      ? item.preset.textOverlay
      : undefined,
    onProgress
  });
}
