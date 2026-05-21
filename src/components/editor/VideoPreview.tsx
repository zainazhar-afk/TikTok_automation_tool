"use client";

import { useEffect, useRef } from "react";
import { useEditorStore } from "@/store/editorStore";
import type { AspectRatio } from "@/types/editor";

const ratioClasses: Record<AspectRatio, string> = {
  original: "aspect-video max-h-[62vh]",
  "9:16": "aspect-[9/16] max-h-[62vh]",
  "1:1": "aspect-square max-h-[62vh]",
  "16:9": "aspect-video max-h-[62vh]"
};

export function VideoPreview({
  currentTime,
  onTimeChange,
  onDuration
}: {
  currentTime: number;
  onTimeChange: (value: number) => void;
  onDuration: (value: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const {
    previewUrl,
    brightness,
    contrast,
    saturation,
    aspectRatio,
    volume,
    muted,
    textOverlay,
    subtitles
  } = useEditorStore();

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = Math.min(Math.max(volume, 0), 1);
    videoRef.current.muted = muted;
  }, [muted, volume]);

  const activeSubtitle = subtitles.find(
    (subtitle) => currentTime >= subtitle.start && currentTime <= subtitle.end
  );

  return (
    <div className="flex h-full min-h-[420px] items-center justify-center rounded-lg border border-white/10 bg-slate-950/80 p-4">
      {previewUrl ? (
        <div className={`relative w-full overflow-hidden rounded-lg bg-black ${ratioClasses[aspectRatio]}`}>
          <video
            ref={videoRef}
            src={previewUrl}
            controls
            className="h-full w-full object-cover"
            style={{
              filter: `brightness(${1 + brightness}) contrast(${contrast}) saturate(${saturation})`
            }}
            onTimeUpdate={(event) => onTimeChange(event.currentTarget.currentTime)}
            onLoadedMetadata={(event) => onDuration(event.currentTarget.duration)}
          />

          {textOverlay.text ? (
            <OverlayText position={textOverlay.position} fontSize={textOverlay.fontSize} color={textOverlay.color}>
              {textOverlay.text}
            </OverlayText>
          ) : null}

          {activeSubtitle ? (
            <div className="pointer-events-none absolute inset-x-8 bottom-9 rounded bg-black/55 px-4 py-2 text-center text-lg font-semibold text-white">
              {activeSubtitle.text}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-lg bg-white/[0.06]" />
          <h2 className="mt-5 text-lg font-semibold text-white">No video selected</h2>
          <p className="mt-2 text-sm text-slate-400">Choose a local upload from the left panel.</p>
        </div>
      )}
    </div>
  );
}

function OverlayText({
  children,
  position,
  fontSize,
  color
}: {
  children: string;
  position: "top" | "center" | "bottom";
  fontSize: number;
  color: string;
}) {
  const positionClass =
    position === "top"
      ? "top-[10%]"
      : position === "center"
        ? "top-1/2 -translate-y-1/2"
        : "bottom-[12%]";

  return (
    <div
      className={`pointer-events-none absolute left-1/2 w-[88%] -translate-x-1/2 text-center font-black leading-tight drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)] ${positionClass}`}
      style={{
        color,
        fontSize: `${fontSize}px`
      }}
    >
      {children}
    </div>
  );
}
