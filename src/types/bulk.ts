import type { AspectRatio, TextOverlay } from "@/types/editor";

export type ExportPreset = "tiktok" | "youtube_shorts" | "instagram_reels";

export type BulkPreset = {
  clipLength: 15 | 30 | 60;
  autoBestSegment: boolean;
  aspectRatio: AspectRatio;
  speed: number;
  brightness: number;
  contrast: number;
  saturation: number;
  volume: number;
  muted: boolean;
  textOverlay: TextOverlay;
  subtitlePlaceholder: boolean;
  exportPreset: ExportPreset;
};

export type QueueStatus = "waiting" | "analyzing" | "exporting" | "done" | "failed";

export type BulkQueueItem = {
  id: string;
  videoId: string;
  videoName: string;
  status: QueueStatus;
  progress: number;
  downloadUrl: string | null;
  downloadName: string | null;
  error: string | null;
  suggestedClip: { start: number; end: number } | null;
  preset: BulkPreset;
};

export type BulkJobState = {
  items: BulkQueueItem[];
  isProcessing: boolean;
};

export type PerVideoResult = {
  status: QueueStatus;
  progress: number;
  downloadUrl: string | null;
  downloadName: string | null;
  error: string | null;
};
