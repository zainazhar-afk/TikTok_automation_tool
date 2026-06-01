"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  Download,
  Eye,
  Loader2,
  Search,
  Square,
  CheckSquare
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { VideoPreview } from "@/components/bulk/VideoPreview";
import { useBulkStore } from "@/store/bulkStore";
import { formatDuration, formatNumber } from "@/lib/videoUtils";
import type { YouTubeVideo } from "@/types/youtube";

const NICHES = [
  { value: "all", label: "All Shorts" },
  { value: "gaming", label: "Gaming" },
  { value: "music", label: "Music" },
  { value: "sports", label: "Sports" },
  { value: "comedy", label: "Comedy" },
  { value: "food", label: "Food" },
  { value: "tech", label: "Tech" },
  { value: "animals", label: "Animals" },
  { value: "diy", label: "DIY & Crafts" },
  { value: "fashion", label: "Fashion" },
  { value: "motivation", label: "Motivation" }
];

export function TrendingVideosGrid() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [niche, setNiche] = useState("all");
  const [downloading, setDownloading] = useState<Set<string>>(new Set());
  const [previewBlob, setPreviewBlob] = useState<{
    blob: Blob;
    name: string;
  } | null>(null);
  const [serverFFmpegAvailable, setServerFFmpegAvailable] = useState(false);

  const selectedIds = useBulkStore((s) => s.selectedVideoIds);
  const downloadedVideos = useBulkStore((s) => s.downloadedVideos);
  const toggleVideo = useBulkStore((s) => s.toggleVideo);
  const selectAll = useBulkStore((s) => s.selectAll);
  const clearSelection = useBulkStore((s) => s.clearSelection);
  const setDownloadedVideo = useBulkStore((s) => s.setDownloadedVideo);

  // Check server FFmpeg availability once on mount
  useEffect(() => {
    fetch("/api/videos/ffmpeg-status")
      .then((res) => res.json())
      .then((data) => setServerFFmpegAvailable(data.available ?? false))
      .catch(() => setServerFFmpegAvailable(false));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchShorts() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/youtube/trending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ niche })
        });

        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Failed to load shorts.");
        if (!cancelled) setVideos(body.videos ?? []);
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Failed to load shorts.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchShorts();
    return () => {
      cancelled = true;
    };
  }, [niche]);

  const filtered = useMemo(() => {
    if (!search.trim()) return videos;
    const term = search.toLowerCase();
    return videos.filter(
      (v) =>
        v.title.toLowerCase().includes(term) ||
        v.description.toLowerCase().includes(term)
    );
  }, [videos, search]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((v) => selectedIds.has(v.id));

  async function handleDownloadSelected() {
    const toDownload = [...selectedIds].filter(
      (id) => !downloadedVideos.has(id)
    );
    if (toDownload.length === 0) return;

    setError("");

    for (const videoId of toDownload) {
      setDownloading((prev) => new Set(prev).add(videoId));

      try {
        const video = videos.find((v) => v.id === videoId);
        if (!video) continue;

        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // Determine download strategy based on server FFmpeg availability
        let tempId: string | undefined;
        let blob: Blob | undefined;
        let title = video.title;
        let duration = 0;

        if (serverFFmpegAvailable) {
          // Server FFmpeg is available — save to .temp/ for fast server-side processing
          try {
            const tempResponse = await fetch("/api/youtube/download?save=temp", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ videoUrl })
            });

            if (tempResponse.ok) {
              const data = await tempResponse.json();
              tempId = data.tempId;
              title = data.title || video.title;
              duration = data.duration || 0;
            }
          } catch {
            // Temp save failed — fall through to direct download
          }
        }

        // Always download a blob so client-side processing works as fallback
        // (skip only if temp save succeeded AND server FFmpeg is confirmed available)
        if (!tempId || !serverFFmpegAvailable) {
          const response = await fetch("/api/youtube/download", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ videoUrl })
          });

          if (!response.ok) {
            const body = await response.json();
            throw new Error(body.error ?? "Download failed.");
          }

          blob = await response.blob();
          title = decodeURIComponent(
            response.headers.get("X-Video-Title") ?? (title || video.title)
          );
          duration = Number(response.headers.get("X-Video-Duration")) || (duration || 0);
        }

        setDownloadedVideo(videoId, {
          blob,
          tempId,
          name: title,
          durationSeconds: duration
        });
      } catch (caught) {
        setError(
          `Download failed: ${caught instanceof Error ? caught.message : "Unknown error"}`
        );
      } finally {
        setDownloading((prev) => {
          const next = new Set(prev);
          next.delete(videoId);
          return next;
        });
      }
    }
  }

  function handlePreview(videoId: string) {
    const entry = downloadedVideos.get(videoId);
    if (entry?.blob) {
      setPreviewBlob({ blob: entry.blob, name: entry.name });
    }
  }

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">YouTube Shorts</h2>
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner label="Loading YouTube Shorts" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-white">YouTube Shorts</h2>
        <div className="flex items-center gap-3">
          {/* Niche selector */}
          <div className="relative">
            <select
              value={niche}
              onChange={(e) => {
                setNiche(e.target.value);
                clearSelection();
              }}
              className="h-9 appearance-none rounded-lg border border-white/[0.08] bg-white/[0.04] pl-3 pr-8 text-sm text-white focus:border-studio-500 focus:outline-none"
            >
              {NICHES.map((n) => (
                <option key={n.value} value={n.value} className="bg-studio-900">
                  {n.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Filter shorts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-40 rounded-lg border border-white/[0.08] bg-white/[0.04] pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-studio-500 focus:outline-none"
            />
          </div>
          <span className="text-xs text-slate-500">
            {selectedIds.size} selected
          </span>
        </div>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      <div className="flex items-center gap-2">
        <button
          onClick={() =>
            allFilteredSelected
              ? clearSelection()
              : selectAll(filtered.map((v) => v.id))
          }
          className="inline-flex h-8 items-center gap-2 rounded-lg px-3 text-xs font-medium text-slate-400 transition hover:bg-white/[0.06] hover:text-white"
        >
          {allFilteredSelected ? (
            <CheckSquare className="h-3.5 w-3.5" />
          ) : (
            <Square className="h-3.5 w-3.5" />
          )}
          {allFilteredSelected ? "Deselect All" : "Select All"}
        </button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleDownloadSelected}
          disabled={selectedIds.size === 0 || downloading.size > 0}
        >
          {downloading.size > 0 ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download Selected
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">
          {search.trim() ? "No shorts match your search." : "No shorts found for this niche."}
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((video) => {
            const isSelected = selectedIds.has(video.id);
            const isDownloaded = downloadedVideos.has(video.id);
            const isDownloading = downloading.has(video.id);

            return (
              <div
                key={video.id}
                className={`group relative cursor-pointer overflow-hidden rounded-lg border transition ${
                  isSelected
                    ? "border-studio-500 bg-studio-500/[0.08]"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
                }`}
                onClick={() => toggleVideo(video.id)}
              >
                <div className="relative aspect-video bg-slate-900">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />

                  <div className="absolute inset-0 flex items-start justify-between p-2">
                    <button
                      className={`flex h-6 w-6 items-center justify-center rounded transition ${
                        isSelected
                          ? "bg-studio-500 text-white"
                          : "bg-black/50 text-white/70 opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : null}
                    </button>

                    <span className="rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
                      {formatDuration(video.durationSeconds)}
                    </span>
                  </div>

                  {isDownloading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  ) : null}
                </div>

                <div className="p-2.5">
                  <p className="line-clamp-2 text-xs font-medium leading-5 text-white">
                    {video.title}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500">
                      {formatNumber(video.viewCount)} views
                    </span>
                    {isDownloaded ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(video.id);
                        }}
                        className="inline-flex h-6 items-center gap-1 rounded px-2 text-[11px] font-medium text-studio-400 transition hover:bg-white/[0.08]"
                      >
                        <Eye className="h-3 w-3" />
                        Preview
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewBlob ? (
        <VideoPreview
          blob={previewBlob.blob}
          name={previewBlob.name}
          onClose={() => setPreviewBlob(null)}
        />
      ) : null}
    </section>
  );
}
