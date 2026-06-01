"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Youtube } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { Input } from "@/components/common/Input";
import { saveVideo } from "@/lib/indexedDb";
import { useEditorStore } from "@/store/editorStore";

export function YouTubeUrlInput() {
  const router = useRouter();
  const setSelectedVideo = useEditorStore((state) => state.setSelectedVideo);
  const [url, setUrl] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter a YouTube video URL.");
      return;
    }

    setError("");
    setIsDownloading(true);
    setProgress("Fetching video info...");

    try {
      const response = await fetch("/api/youtube/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: trimmed })
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Download failed.");
      }

      const title = decodeURIComponent(
        response.headers.get("X-Video-Title") ?? "youtube_video"
      );
      const durationSeconds = Number(response.headers.get("X-Video-Duration") ?? "0");
      const contentType = response.headers.get("Content-Type") ?? "video/mp4";

      setProgress("Downloading video...");

      const blob = await response.blob();

      if (blob.size === 0) {
        throw new Error("Downloaded file is empty. The video may not be accessible.");
      }

      setProgress("Saving to local library...");

      const video = await saveVideo(
        new File([blob], `${title}.mp4`, { type: contentType })
      );

      if (durationSeconds > 0 && !video.duration) {
        video.duration = durationSeconds;
      }

      setSelectedVideo(video.id, video.file);
      router.push(`/editor?videoId=${video.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to download this video.");
    } finally {
      setIsDownloading(false);
      setProgress("");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed border-white/[0.18] bg-slate-950/40 p-6">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-500/[0.18] text-red-400">
                  <Youtube className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-white">Download YouTube video</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Paste a YouTube video URL to download and open in the editor.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="min-w-[320px]"
                disabled={isDownloading}
              />
              <Button type="submit" disabled={isDownloading}>
                {isDownloading ? (
                  "Downloading..."
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {progress ? (
        <div className="rounded-lg border border-blue-300/20 bg-blue-400/10 p-4 text-sm text-blue-100">
          {progress}
        </div>
      ) : null}

      {error ? <ErrorMessage message={error} /> : null}
    </div>
  );
}
