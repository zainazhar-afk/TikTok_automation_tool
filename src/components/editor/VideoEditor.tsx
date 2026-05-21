"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileVideo } from "lucide-react";
import { AspectRatioControls } from "@/components/editor/AspectRatioControls";
import { AudioControls } from "@/components/editor/AudioControls";
import { AutoClipControls } from "@/components/editor/AutoClipControls";
import { ColorControls } from "@/components/editor/ColorControls";
import { EditorTimeline } from "@/components/editor/EditorTimeline";
import { ExportPanel } from "@/components/editor/ExportPanel";
import { SpeedControls } from "@/components/editor/SpeedControls";
import { SubtitleControls } from "@/components/editor/SubtitleControls";
import { TextOverlayControls } from "@/components/editor/TextOverlayControls";
import { TrimControls } from "@/components/editor/TrimControls";
import { VideoPreview } from "@/components/editor/VideoPreview";
import { Button } from "@/components/common/Button";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { getVideoById, getVideos, type LocalVideo } from "@/lib/indexedDb";
import { formatBytes, formatDuration } from "@/lib/videoUtils";
import { useEditorStore } from "@/store/editorStore";

export function VideoEditor() {
  const searchParams = useSearchParams();
  const selectedVideoId = useEditorStore((state) => state.selectedVideoId);
  const selectedVideoBlob = useEditorStore((state) => state.selectedVideoBlob);
  const setSelectedVideo = useEditorStore((state) => state.setSelectedVideo);
  const setTrimStart = useEditorStore((state) => state.setTrimStart);
  const setTrimEnd = useEditorStore((state) => state.setTrimEnd);
  const [videos, setVideos] = useState<LocalVideo[]>([]);
  const [selectedMeta, setSelectedMeta] = useState<LocalVideo | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLocalVideos();
  }, []);

  useEffect(() => {
    const id = searchParams.get("videoId");
    if (!id || selectedVideoId === id) return;

    getVideoById(id)
      .then((video) => {
        if (video) {
          chooseVideo(video);
        }
      })
      .catch((caught) =>
        setError(caught instanceof Error ? caught.message : "Unable to load the requested video.")
      );
  }, [searchParams, selectedVideoId]);

  const activeVideo = useMemo(
    () => selectedMeta ?? videos.find((video) => video.id === selectedVideoId) ?? null,
    [selectedMeta, selectedVideoId, videos]
  );

  async function loadLocalVideos() {
    setError("");

    try {
      const loaded = await getVideos();
      setVideos(loaded);

      if (!selectedVideoBlob) {
        const id = searchParams.get("videoId");
        const initial = loaded.find((video) => video.id === id) ?? loaded[0];
        if (initial) chooseVideo(initial);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load local videos.");
    }
  }

  function chooseVideo(video: LocalVideo) {
    setSelectedMeta(video);
    setSelectedVideo(video.id, video.file);
    setTrimStart(0);
    const nextDuration = video.duration ?? 30;
    setDuration(nextDuration);
    setTrimEnd(Math.min(nextDuration, 60));
  }

  return (
    <div className="grid min-h-[calc(100vh-72px)] grid-rows-[1fr_auto]">
      <div className="grid min-h-0 gap-0 xl:grid-cols-[300px_1fr_380px]">
        <aside className="min-h-0 border-b border-white/10 bg-white/[0.025] p-5 xl:border-b-0 xl:border-r">
          <div className="flex items-center gap-3">
            <FileVideo className="h-5 w-5 text-studio-400" />
            <h2 className="text-lg font-semibold text-white">Uploaded videos</h2>
          </div>
          {error ? <div className="mt-4"><ErrorMessage message={error} /></div> : null}
          <div className="mt-5 space-y-3">
            {videos.length === 0 ? (
              <p className="text-sm leading-6 text-slate-400">
                Upload a video from the dashboard to start editing.
              </p>
            ) : (
              videos.map((video) => (
                <button
                  key={video.id}
                  type="button"
                  onClick={() => chooseVideo(video)}
                  className={`w-full rounded-lg border p-3 text-left transition ${
                    selectedVideoId === video.id
                      ? "border-studio-400 bg-studio-500/[0.18]"
                      : "border-white/10 bg-slate-950/45 hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="truncate text-sm font-semibold text-white">{video.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {formatBytes(video.size)} | {formatDuration(video.duration)}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="mt-6 rounded-lg border border-white/10 bg-slate-950/45 p-4">
            <h3 className="text-sm font-semibold text-white">Selected project</h3>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {activeVideo ? activeVideo.name : "No source video selected."}
            </p>
            {activeVideo ? (
              <div className="mt-3 text-xs text-slate-500">
                {formatBytes(activeVideo.size)} | {formatDuration(activeVideo.duration)}
              </div>
            ) : null}
          </div>
        </aside>

        <section className="min-w-0 p-5">
          <VideoPreview
            currentTime={currentTime}
            onTimeChange={setCurrentTime}
            onDuration={(value) => {
              setDuration(value);
              if (!activeVideo?.duration) {
                setTrimEnd(Math.min(value, 60));
              }
            }}
          />
        </section>

        <aside className="min-h-0 overflow-y-auto border-t border-white/10 bg-white/[0.025] p-5 xl:border-l xl:border-t-0">
          <div className="space-y-6">
            <AutoClipControls duration={duration} />
            <TrimControls duration={duration} />
            <SpeedControls />
            <ColorControls />
            <AspectRatioControls />
            <AudioControls />
            <TextOverlayControls />
            <SubtitleControls />
            <ExportPanel />
          </div>
        </aside>
      </div>

      <div className="border-t border-white/10 bg-studio-950 p-5">
        <EditorTimeline duration={duration} currentTime={currentTime} />
      </div>
    </div>
  );
}
