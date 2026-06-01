"use client";

import { create } from "zustand";
import type {
  BulkPreset,
  BulkQueueItem,
  QueueStatus,
  PerVideoResult
} from "@/types/bulk";

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

export type DownloadedEntry = {
  blob?: Blob;
  tempId?: string;
  name: string;
  durationSeconds: number;
  thumbnailUrl?: string;
};

type BulkState = {
  selectedVideoIds: Set<string>;
  downloadedVideos: Map<string, DownloadedEntry>;
  preset: BulkPreset;
  queue: BulkQueueItem[];
  isProcessing: boolean;
  ffmpegStatus: "idle" | "loading" | "ready" | "error";
  ffmpegError: string | null;
  videoPresets: Map<string, BulkPreset>;
  perVideoResults: Map<string, PerVideoResult>;

  // Selection
  toggleVideo: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;

  // Downloads
  setDownloadedVideo: (id: string, entry: DownloadedEntry) => void;
  removeDownloadedVideo: (id: string) => void;

  // Preset
  updatePreset: (partial: Partial<BulkPreset>) => void;

  // Queue
  addToQueue: () => void;
  removeFromQueue: (id: string) => void;
  retryItem: (id: string) => void;
  updateQueueItem: (id: string, update: Partial<BulkQueueItem>) => void;
  setProcessing: (value: boolean) => void;
  resetQueue: () => void;

  // FFmpeg
  setFFmpegStatus: (status: "idle" | "loading" | "ready" | "error") => void;
  setFFmpegError: (error: string | null) => void;

  // Per-video presets
  setVideoPreset: (id: string, partial: Partial<BulkPreset>) => void;
  applySidebarToSelected: (preset: BulkPreset) => void;
  removeVideoPreset: (id: string) => void;

  // Per-video results
  resetPerVideoResult: (id: string) => void;
  updatePerVideoResult: (id: string, update: Partial<PerVideoResult>) => void;
};

export const useBulkStore = create<BulkState>((set, get) => ({
  selectedVideoIds: new Set<string>(),
  downloadedVideos: new Map<string, DownloadedEntry>(),
  preset: { ...defaultPreset },
  queue: [],
  isProcessing: false,
  ffmpegStatus: "idle",
  ffmpegError: null,
  videoPresets: new Map<string, BulkPreset>(),
  perVideoResults: new Map<string, PerVideoResult>(),

  toggleVideo: (id) =>
    set((state) => {
      const next = new Set(state.selectedVideoIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { selectedVideoIds: next };
    }),

  selectAll: (ids) =>
    set(() => ({
      selectedVideoIds: new Set(ids)
    })),

  clearSelection: () =>
    set(() => ({
      selectedVideoIds: new Set()
    })),

  setDownloadedVideo: (id, entry) =>
    set((state) => {
      const next = new Map(state.downloadedVideos);
      next.set(id, entry);
      return { downloadedVideos: next };
    }),

  removeDownloadedVideo: (id) =>
    set((state) => {
      const nextDownloads = new Map(state.downloadedVideos);
      nextDownloads.delete(id);

      const nextPresets = new Map(state.videoPresets);
      nextPresets.delete(id);

      const nextResults = new Map(state.perVideoResults);
      const result = nextResults.get(id);
      if (result?.downloadUrl) {
        URL.revokeObjectURL(result.downloadUrl);
      }
      nextResults.delete(id);

      return {
        downloadedVideos: nextDownloads,
        videoPresets: nextPresets,
        perVideoResults: nextResults
      };
    }),

  updatePreset: (partial) =>
    set((state) => ({
      preset: { ...state.preset, ...partial }
    })),

  addToQueue: () => {
    const { selectedVideoIds, downloadedVideos, preset, videoPresets } = get();

    const newItems: BulkQueueItem[] = [];

    selectedVideoIds.forEach((videoId) => {
      const downloaded = downloadedVideos.get(videoId);
      if (!downloaded) return;

      // Skip if already in queue
      const alreadyQueued = get().queue.some((item) => item.videoId === videoId);
      if (alreadyQueued) return;

      // Per-video preset takes precedence over global preset
      const videoPreset = videoPresets.get(videoId) ?? preset;

      newItems.push({
        id: createId(),
        videoId,
        videoName: downloaded.name,
        status: "waiting",
        progress: 0,
        downloadUrl: null,
        downloadName: null,
        error: null,
        suggestedClip: null,
        preset: { ...videoPreset }
      });
    });

    set((state) => ({
      queue: [...state.queue, ...newItems]
    }));
  },

  removeFromQueue: (id) =>
    set((state) => {
      const item = state.queue.find((item) => item.id === id);
      if (item?.downloadUrl) {
        URL.revokeObjectURL(item.downloadUrl);
      }
      return {
        queue: state.queue.filter((item) => item.id !== id)
      };
    }),

  retryItem: (id) =>
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id
          ? { ...item, status: "waiting" as QueueStatus, progress: 0, error: null }
          : item
      )
    })),

  updateQueueItem: (id, update) =>
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, ...update } : item
      )
    })),

  setProcessing: (value) => set({ isProcessing: value }),

  resetQueue: () =>
    set((state) => {
      for (const item of state.queue) {
        if (item.downloadUrl) {
          URL.revokeObjectURL(item.downloadUrl);
        }
      }
      return {
        queue: [],
        isProcessing: false
      };
    }),

  setFFmpegStatus: (ffmpegStatus) => set({ ffmpegStatus }),
  setFFmpegError: (ffmpegError) => set({ ffmpegError }),

  // ── Per-video presets ────────────────────────────────────────────

  setVideoPreset: (id, partial) =>
    set((state) => {
      const next = new Map(state.videoPresets);
      const existing = next.get(id);
      if (existing) {
        next.set(id, { ...existing, ...partial });
      } else {
        next.set(id, { ...defaultPreset, ...partial });
      }
      return { videoPresets: next };
    }),

  applySidebarToSelected: (preset) =>
    set((state) => {
      const next = new Map(state.videoPresets);
      state.selectedVideoIds.forEach((id) => {
        next.set(id, { ...preset });
      });
      return { videoPresets: next, preset: { ...preset } };
    }),

  removeVideoPreset: (id) =>
    set((state) => {
      const next = new Map(state.videoPresets);
      next.delete(id);
      return { videoPresets: next };
    }),

  // ── Per-video results ────────────────────────────────────────────

  resetPerVideoResult: (id) =>
    set((state) => {
      const next = new Map(state.perVideoResults);
      const existing = next.get(id);
      if (existing?.downloadUrl) {
        URL.revokeObjectURL(existing.downloadUrl);
      }
      next.set(id, {
        status: "waiting",
        progress: 0,
        downloadUrl: null,
        downloadName: null,
        error: null
      });
      return { perVideoResults: next };
    }),

  updatePerVideoResult: (id, update) =>
    set((state) => {
      const next = new Map(state.perVideoResults);
      const existing = next.get(id) ?? {
        status: "waiting" as QueueStatus,
        progress: 0,
        downloadUrl: null,
        downloadName: null,
        error: null
      };
      next.set(id, { ...existing, ...update });
      return { perVideoResults: next };
    })
}));

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
