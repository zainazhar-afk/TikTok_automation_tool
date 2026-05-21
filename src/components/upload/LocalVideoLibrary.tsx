"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Trash2, Wand2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { clearVideos, deleteVideo, getVideos, type LocalVideo } from "@/lib/indexedDb";
import { formatBytes, formatDuration } from "@/lib/videoUtils";
import { useEditorStore } from "@/store/editorStore";

export function LocalVideoLibrary({
  refreshKey = 0,
  compact = false
}: {
  refreshKey?: number;
  compact?: boolean;
}) {
  const router = useRouter();
  const setSelectedVideo = useEditorStore((state) => state.setSelectedVideo);
  const [videos, setVideos] = useState<LocalVideo[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, [refreshKey]);

  async function loadVideos() {
    setIsLoading(true);
    setError("");

    try {
      setVideos(await getVideos());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load local videos.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteVideo(id);
      setVideos((current) => current.filter((video) => video.id !== id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete this video.");
    }
  }

  async function handleClear() {
    try {
      await clearVideos();
      setVideos([]);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to clear local videos.");
    }
  }

  function openEditor(video: LocalVideo) {
    setSelectedVideo(video.id, video.file);
    router.push(`/editor?videoId=${video.id}`);
  }

  if (isLoading) {
    return <div className="text-sm text-slate-400">Loading local videos...</div>;
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorMessage message={error} /> : null}

      {videos.length === 0 ? (
        <EmptyState
          title="No local videos yet"
          body="Upload a source video that you own to start editing."
        />
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-400">{videos.length} local video{videos.length === 1 ? "" : "s"}</div>
            {!compact ? (
              <Button variant="ghost" size="sm" onClick={handleClear}>
                Clear All
              </Button>
            ) : null}
          </div>
          <div className="space-y-3">
            {videos.map((video) => (
              <div
                key={video.id}
                className="flex flex-col gap-3 rounded-lg border border-white/10 bg-slate-950/42 p-3 sm:flex-row sm:items-center"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-studio-400">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">{video.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {formatBytes(video.size)} | {formatDuration(video.duration)} |{" "}
                    {new Date(video.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => openEditor(video)}>
                    <Wand2 className="h-4 w-4" />
                    Open Editor
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(video.id)} aria-label="Delete video">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
