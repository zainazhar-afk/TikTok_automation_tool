"use client";

import { useState } from "react";
import {
  Image,
  Layers,
  ListVideo,
  Smartphone,
  Type
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { useBulkStore } from "@/store/bulkStore";
import {
  Section,
  Slider,
  PresetButton,
  CLIP_LENGTHS,
  SPEEDS,
  FONT_SIZES
} from "@/components/bulk/EditControls";
import type { AspectRatio, TextOverlayPosition } from "@/types/editor";

export function BulkEditPanel() {
  const preset = useBulkStore((s) => s.preset);
  const updatePreset = useBulkStore((s) => s.updatePreset);
  const selectedIds = useBulkStore((s) => s.selectedVideoIds);
  const downloadedVideos = useBulkStore((s) => s.downloadedVideos);
  const addToQueue = useBulkStore((s) => s.addToQueue);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    clip: true,
    video: true,
    overlay: false,
    presets: true
  });

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const canAddToQueue =
    selectedIds.size > 0 &&
    [...selectedIds].some((id) => downloadedVideos.has(id));

  function applyPreset(
    preset: "tiktok" | "youtube_shorts" | "instagram_reels"
  ) {
    updatePreset({
      aspectRatio: "9:16",
      exportPreset: preset
    });
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-r border-white/[0.06] bg-studio-950">
      <div className="flex-1 space-y-1 p-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-studio-400">
          Bulk Edit Settings
        </h2>

        {/* Clip Settings */}
        <Section
          label="Clip Settings"
          icon={<ListVideo className="h-4 w-4" />}
          open={openSections.clip}
          onToggle={() => toggleSection("clip")}
        >
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-400">
                Clip Length
              </span>
              <div className="mt-1.5 flex gap-1.5">
                {CLIP_LENGTHS.map((len) => (
                  <button
                    key={len}
                    onClick={() => updatePreset({ clipLength: len })}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                      preset.clipLength === len
                        ? "bg-studio-500 text-white"
                        : "bg-white/[0.05] text-slate-400 hover:bg-white/[0.1] hover:text-white"
                    }`}
                  >
                    {len}s
                  </button>
                ))}
              </div>
            </label>

            <label className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Auto Best Segment
              </span>
              <button
                onClick={() =>
                  updatePreset({ autoBestSegment: !preset.autoBestSegment })
                }
                className={`relative h-5 w-9 rounded-full transition ${
                  preset.autoBestSegment ? "bg-studio-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                    preset.autoBestSegment ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </button>
            </label>

            {!preset.autoBestSegment ? (
              <p className="text-[11px] leading-5 text-slate-500">
                Manual trim is not available in bulk mode. The clip will start
                at the beginning of the video for the selected duration.
              </p>
            ) : null}
          </div>
        </Section>

        {/* Video Adjustments */}
        <Section
          label="Video Adjustments"
          icon={<Image className="h-4 w-4" />}
          open={openSections.video}
          onToggle={() => toggleSection("video")}
        >
          <div className="space-y-3">
            {/* Aspect Ratio */}
            <div>
              <span className="text-xs font-medium text-slate-400">
                Aspect Ratio
              </span>
              <div className="mt-1.5 flex gap-1.5">
                {(
                  [
                    ["9:16", "9:16"],
                    ["1:1", "1:1"],
                    ["16:9", "16:9"],
                    ["Orig", "original"]
                  ] as [string, AspectRatio][]
                ).map(([label, value]) => (
                  <button
                    key={value}
                    onClick={() => updatePreset({ aspectRatio: value })}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                      preset.aspectRatio === value
                        ? "bg-studio-500 text-white"
                        : "bg-white/[0.05] text-slate-400 hover:bg-white/[0.1] hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Speed */}
            <div>
              <span className="text-xs font-medium text-slate-400">Speed</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {SPEEDS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => updatePreset({ speed })}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      preset.speed === speed
                        ? "bg-studio-500 text-white"
                        : "bg-white/[0.05] text-slate-400 hover:bg-white/[0.1] hover:text-white"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>

            {/* Color sliders */}
            <Slider
              label="Brightness"
              min={-100}
              max={100}
              value={preset.brightness}
              onChange={(v) => updatePreset({ brightness: v })}
            />
            <Slider
              label="Contrast"
              min={-100}
              max={100}
              value={preset.contrast}
              onChange={(v) => updatePreset({ contrast: v })}
            />
            <Slider
              label="Saturation"
              min={-100}
              max={100}
              value={preset.saturation}
              onChange={(v) => updatePreset({ saturation: v })}
            />

            {/* Volume + Mute */}
            <Slider
              label="Volume"
              min={0}
              max={200}
              value={preset.volume}
              onChange={(v) => updatePreset({ volume: v })}
            />
            <label className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Mute</span>
              <button
                onClick={() => updatePreset({ muted: !preset.muted })}
                className={`relative h-5 w-9 rounded-full transition ${
                  preset.muted ? "bg-red-500/70" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                    preset.muted ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </button>
            </label>
          </div>
        </Section>

        {/* Overlay Options */}
        <Section
          label="Overlay Options"
          icon={<Type className="h-4 w-4" />}
          open={openSections.overlay}
          onToggle={() => toggleSection("overlay")}
        >
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-slate-400">
                Text Overlay
              </span>
              <input
                type="text"
                placeholder="Enter overlay text..."
                value={preset.textOverlay.text}
                onChange={(e) =>
                  updatePreset({
                    textOverlay: {
                      ...preset.textOverlay,
                      text: e.target.value
                    }
                  })
                }
                className="mt-1.5 block w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:border-studio-500 focus:outline-none"
              />
            </label>

            <div>
              <span className="text-xs font-medium text-slate-400">
                Position
              </span>
              <div className="mt-1.5 flex gap-1.5">
                {(["top", "center", "bottom"] as TextOverlayPosition[]).map(
                  (pos) => (
                    <button
                      key={pos}
                      onClick={() =>
                        updatePreset({
                          textOverlay: {
                            ...preset.textOverlay,
                            position: pos
                          }
                        })
                      }
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize transition ${
                        preset.textOverlay.position === pos
                          ? "bg-studio-500 text-white"
                          : "bg-white/[0.05] text-slate-400 hover:bg-white/[0.1] hover:text-white"
                      }`}
                    >
                      {pos}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-medium text-slate-400">
                Font Size
              </span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {FONT_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() =>
                      updatePreset({
                        textOverlay: {
                          ...preset.textOverlay,
                          fontSize: size
                        }
                      })
                    }
                    className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
                      preset.textOverlay.fontSize === size
                        ? "bg-studio-500 text-white"
                        : "bg-white/[0.05] text-slate-400 hover:bg-white/[0.1] hover:text-white"
                    }`}
                  >
                    {size}px
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">
                Text Color
              </span>
              <input
                type="color"
                value={preset.textOverlay.color}
                onChange={(e) =>
                  updatePreset({
                    textOverlay: {
                      ...preset.textOverlay,
                      color: e.target.value
                    }
                  })
                }
                className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Subtitle Placeholder
              </span>
              <button
                onClick={() =>
                  updatePreset({
                    subtitlePlaceholder: !preset.subtitlePlaceholder
                  })
                }
                className={`relative h-5 w-9 rounded-full transition ${
                  preset.subtitlePlaceholder
                    ? "bg-studio-500"
                    : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                    preset.subtitlePlaceholder
                      ? "left-[18px]"
                      : "left-0.5"
                  }`}
                />
              </button>
            </label>
          </div>
        </Section>

        {/* Export Presets */}
        <Section
          label="Export Presets"
          icon={<Smartphone className="h-4 w-4" />}
          open={openSections.presets}
          onToggle={() => toggleSection("presets")}
        >
          <div className="space-y-2">
            <PresetButton
              label="TikTok"
              detail="9:16, 1080x1920"
              active={preset.exportPreset === "tiktok"}
              onClick={() => applyPreset("tiktok")}
            />
            <PresetButton
              label="YouTube Shorts"
              detail="9:16, 1080x1920"
              active={preset.exportPreset === "youtube_shorts"}
              onClick={() => applyPreset("youtube_shorts")}
            />
            <PresetButton
              label="Instagram Reels"
              detail="9:16, 1080x1920"
              active={preset.exportPreset === "instagram_reels"}
              onClick={() => applyPreset("instagram_reels")}
            />
          </div>
        </Section>
      </div>

      {/* Bottom action */}
      <div className="border-t border-white/[0.06] p-4 space-y-2">
        <Button
          className="w-full"
          onClick={addToQueue}
          disabled={!canAddToQueue}
        >
          <Layers className="h-4 w-4" />
          Add to Queue
        </Button>
        {!canAddToQueue ? (
          <p className="text-center text-[11px] text-slate-600">
            Select and download videos first
          </p>
        ) : null}
      </div>
    </aside>
  );
}

