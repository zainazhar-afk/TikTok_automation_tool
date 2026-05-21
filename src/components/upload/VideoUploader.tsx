"use client";

import { ChangeEvent, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { saveVideo, type LocalVideo } from "@/lib/indexedDb";
import { formatBytes, formatDuration } from "@/lib/videoUtils";
import { validateVideoFile } from "@/lib/validators";

export function VideoUploader({
  onSaved
}: {
  onSaved?: (video: LocalVideo) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedVideo, setSavedVideo] = useState<LocalVideo | null>(null);
  const [error, setError] = useState("");

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setSavedVideo(null);
    setIsSaving(true);

    try {
      validateVideoFile(file);
      const video = await saveVideo(file);
      setSavedVideo(video);
      onSaved?.(video);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save this video locally.");
    } finally {
      setIsSaving(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-dashed border-white/[0.18] bg-slate-950/40 p-6">
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
          className="sr-only"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-studio-500/[0.18] text-studio-400">
                <UploadCloud className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold text-white">Upload your source video</h3>
                <p className="mt-1 text-sm text-slate-400">MP4, MOV, or WebM up to 1 GB.</p>
              </div>
            </div>
          </div>
          <Button onClick={() => inputRef.current?.click()} disabled={isSaving}>
            {isSaving ? "Saving Locally" : "Choose Video"}
          </Button>
        </div>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      {savedVideo ? (
        <div className="rounded-lg border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          Saved {savedVideo.name} locally ({formatBytes(savedVideo.size)}
          {savedVideo.duration ? `, ${formatDuration(savedVideo.duration)}` : ""}).
        </div>
      ) : null}
    </div>
  );
}
