"use client";

import Dexie, { type Table } from "dexie";
import { getVideoDuration } from "@/lib/videoUtils";
import type { YouTubeChannel, YouTubeVideo } from "@/types/youtube";

export type LocalVideo = {
  id: string;
  name: string;
  type: string;
  size: number;
  duration?: number;
  createdAt: string;
  file: Blob;
};

export type YouTubeAnalysisSnapshot = {
  id: "latest";
  channel: YouTubeChannel;
  videos: YouTubeVideo[];
  selectedReference: YouTubeVideo | null;
  createdAt: string;
  updatedAt: string;
};

class ClipStudioDatabase extends Dexie {
  videos!: Table<LocalVideo, string>;
  youtubeSnapshots!: Table<YouTubeAnalysisSnapshot, string>;

  constructor() {
    super("short_clip_studio");
    this.version(1).stores({
      videos: "id, name, createdAt"
    });
    this.version(2).stores({
      videos: "id, name, createdAt",
      youtubeSnapshots: "id, updatedAt"
    });
  }
}

let db: ClipStudioDatabase | null = null;

export async function saveVideo(file: File): Promise<LocalVideo> {
  const database = getDatabase();
  const duration = await getVideoDuration(file).catch(() => undefined);
  const video: LocalVideo = {
    id: createId(),
    name: file.name,
    type: file.type || "video/mp4",
    size: file.size,
    duration,
    createdAt: new Date().toISOString(),
    file
  };

  await database.videos.put(video);
  return video;
}

export async function getVideos(): Promise<LocalVideo[]> {
  return getDatabase().videos.orderBy("createdAt").reverse().toArray();
}

export async function getVideoById(id: string): Promise<LocalVideo | undefined> {
  return getDatabase().videos.get(id);
}

export async function deleteVideo(id: string): Promise<void> {
  await getDatabase().videos.delete(id);
}

export async function clearVideos(): Promise<void> {
  await getDatabase().videos.clear();
}

export async function saveYouTubeAnalysis(input: {
  channel: YouTubeChannel;
  videos: YouTubeVideo[];
  selectedReference?: YouTubeVideo | null;
}): Promise<YouTubeAnalysisSnapshot> {
  const existing = await getDatabase().youtubeSnapshots.get("latest");
  const now = new Date().toISOString();
  const snapshot: YouTubeAnalysisSnapshot = {
    id: "latest",
    channel: input.channel,
    videos: input.videos,
    selectedReference: input.selectedReference ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  await getDatabase().youtubeSnapshots.put(snapshot);
  return snapshot;
}

export async function getYouTubeAnalysis(): Promise<YouTubeAnalysisSnapshot | undefined> {
  return getDatabase().youtubeSnapshots.get("latest");
}

export async function saveSelectedReference(
  selectedReference: YouTubeVideo | null
): Promise<void> {
  const database = getDatabase();
  const existing = await database.youtubeSnapshots.get("latest");
  if (!existing) return;

  await database.youtubeSnapshots.put({
    ...existing,
    selectedReference,
    updatedAt: new Date().toISOString()
  });
}

export async function clearYouTubeAnalysis(): Promise<void> {
  await getDatabase().youtubeSnapshots.delete("latest");
}

function getDatabase(): ClipStudioDatabase {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    throw new Error("IndexedDB is unavailable in this browser.");
  }

  db ??= new ClipStudioDatabase();
  return db;
}

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
