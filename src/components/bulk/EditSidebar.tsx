"use client";

import { useEffect, useRef, useState } from "react";
import { Image, ListVideo, Smartphone, Type } from "lucide-react";
import { Button } from "@/components/common/Button";
import {
  Section,
  Slider,
  PresetButton,
  CLIP_LENGTHS,
  SPEEDS,
  FONT_SIZES
} from "@/components/bulk/EditControls";
import { useBulkStore } from "@/store/bulkStore";
import type { AspectRatio, TextOverlayPosition } from "@/types/editor";
import type { BulkPreset } from "@/types/bulk";

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

export function EditSidebar() {
  const selectedIds = useBulkStore((s) => s.selectedVideoIds);
  const videoPresets = useBulkStore((s) => s.videoPresets);
  const setVideoPreset = useBulkStore((s) => s.setVideoPreset);
  const applySidebarToSelected = useBulkStore((s) => s.applySidebarToSelected);

  const [sidebarPreset, setSidebarPreset] = useState<BulkPreset>(defaultPreset);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    clip: true,
    video: true,
    overlay: false,
    presets: true
  });

  // Track the single video ID so we know when selection changes to a different video
  const syncIdRef = useRef<string | null>(null);

  // Sync sidebar to the selected video's preset
  useEffect(() => {
    if (selectedIds.size === 1) {
      const [id] = [...selectedIds];
      if (id !== syncIdRef.current) {
        syncIdRef.current = id;
        const existing = videoPresets.get(id);
        setSidebarPreset(existing ?? { ...defaultPreset });
      }
    } else if (selectedIds.size === 0) {
      syncIdRef.current = null;
      setSidebarPreset({ ...defaultPreset });
    }
    // When size > 1, keep current sidebar state — it represents the "apply to all" intent
  }, [selectedIds, videoPresets]);

  function update(partial: Partial<BulkPreset>) {
    const next = { ...sidebarPreset, ...partial };
    setSidebarPreset(next);

    // Auto-apply when exactly 1 video is selected
    if (selectedIds.size === 1) {
      const [id] = [...selectedIds];
      setVideoPreset(id, partial);
    }
  }

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleApplyPreset(preset: "tiktok" | "youtube_shorts" | "instagram_reels") {
    update({ aspectRatio: "9:16", exportPreset: preset });
  }

  function handleApplyToSelected() {
    applySidebarToSelected(sidebarPreset);
  }

  const applyLabel =
    selectedIds.size <= 1
      ? "Apply to Video"
      : `Apply to Selected (${selectedIds.size})`;

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-r border-white/[0.06] bg-studio-950">
      <div className="flex-1 space-y-1 p-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-studio-400">
          Edit Settings
        </h2>

        {selectedIds.size > 1 ? (
          <p className="-mt-2 mb-3 text-[11px] leading-5 text-slate-500">
            Changes are staged. Click &ldquo;Apply to Selected&rdquo; to push
            settings to all {selectedIds.size} checked videos.
          </p>
        ) : null}

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
                    onClick={() => update({ clipLength: len })}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                      sidebarPreset.clipLength === len
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
                  update({ autoBestSegment: !sidebarPreset.autoBestSegment })
                }
                className={`relative h-5 w-9 rounded-full transition ${
                  sidebarPreset.autoBestSegment ? "bg-studio-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                    sidebarPreset.autoBestSegment ? "left-[18px]" : "left-0.5"
                  }`}
                />
              </button>
            </label>
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
                    onClick={() => update({ aspectRatio: value })}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                      sidebarPreset.aspectRatio === value
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
                    onClick={() => update({ speed })}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      sidebarPreset.speed === speed
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
              value={sidebarPreset.brightness}
              onChange={(v) => update({ brightness: v })}
            />
            <Slider
              label="Contrast"
              min={-100}
              max={100}
              value={sidebarPreset.contrast}
              onChange={(v) => update({ contrast: v })}
            />
            <Slider
              label="Saturation"
              min={-100}
              max={100}
              value={sidebarPreset.saturation}
              onChange={(v) => update({ saturation: v })}
            />

            {/* Volume + Mute */}
            <Slider
              label="Volume"
              min={0}
              max={200}
              value={sidebarPreset.volume}
              onChange={(v) => update({ volume: v })}
            />
            <label className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Mute</span>
              <button
                onClick={() => update({ muted: !sidebarPreset.muted })}
                className={`relative h-5 w-9 rounded-full transition ${
                  sidebarPreset.muted ? "bg-red-500/70" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                    sidebarPreset.muted ? "left-[18px]" : "left-0.5"
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
                value={sidebarPreset.textOverlay.text}
                onChange={(e) =>
                  update({
                    textOverlay: {
                      ...sidebarPreset.textOverlay,
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
                        update({
                          textOverlay: {
                            ...sidebarPreset.textOverlay,
                            position: pos
                          }
                        })
                      }
                      className={`flex-1 rounded-lg py-1.5 text-xs font-semibold capitalize transition ${
                        sidebarPreset.textOverlay.position === pos
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
                      update({
                        textOverlay: {
                          ...sidebarPreset.textOverlay,
                          fontSize: size
                        }
                      })
                    }
                    className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
                      sidebarPreset.textOverlay.fontSize === size
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
                value={sidebarPreset.textOverlay.color}
                onChange={(e) =>
                  update({
                    textOverlay: {
                      ...sidebarPreset.textOverlay,
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
                  update({
                    subtitlePlaceholder: !sidebarPreset.subtitlePlaceholder
                  })
                }
                className={`relative h-5 w-9 rounded-full transition ${
                  sidebarPreset.subtitlePlaceholder
                    ? "bg-studio-500"
                    : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition ${
                    sidebarPreset.subtitlePlaceholder
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
              active={sidebarPreset.exportPreset === "tiktok"}
              onClick={() => handleApplyPreset("tiktok")}
            />
            <PresetButton
              label="YouTube Shorts"
              detail="9:16, 1080x1920"
              active={sidebarPreset.exportPreset === "youtube_shorts"}
              onClick={() => handleApplyPreset("youtube_shorts")}
            />
            <PresetButton
              label="Instagram Reels"
              detail="9:16, 1080x1920"
              active={sidebarPreset.exportPreset === "instagram_reels"}
              onClick={() => handleApplyPreset("instagram_reels")}
            />
          </div>
        </Section>
      </div>

      {/* Bottom action */}
      <div className="border-t border-white/[0.06] p-4 space-y-2">
        <Button
          className="w-full"
          onClick={handleApplyToSelected}
          disabled={selectedIds.size === 0}
        >
          {applyLabel}
        </Button>
        {selectedIds.size === 0 ? (
          <p className="text-center text-[11px] text-slate-600">
            Check one or more videos to edit
          </p>
        ) : null}
      </div>
    </aside>
  );
}
