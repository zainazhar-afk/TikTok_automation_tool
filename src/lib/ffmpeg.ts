"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import type { AspectRatio, SubtitleLine, TextOverlay } from "@/types/editor";

type ExportOptions = {
  inputBlob: Blob;
  trimStart: number;
  trimEnd: number;
  speed: number;
  brightness: number;
  contrast: number;
  saturation: number;
  aspectRatio: AspectRatio;
  volume: number;
  muted: boolean;
  textOverlay?: TextOverlay;
  subtitles?: Omit<SubtitleLine, "id">[];
  onProgress?: (progress: number) => void;
};

let ffmpeg: FFmpeg | null = null;
let loadPromise: Promise<void> | null = null;

export function loadFFmpeg(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("FFmpeg can only run in the browser."));
  }

  if (ffmpeg?.loaded) {
    return Promise.resolve();
  }

  if (!loadPromise) {
    loadPromise = loadFFmpegInternal();
  }

  return loadPromise;
}

export async function exportEditedVideo(options: ExportOptions): Promise<Blob> {
  await loadFFmpeg();

  if (!ffmpeg) {
    throw new Error("FFmpeg failed to initialize.");
  }

  if (options.trimEnd <= options.trimStart) {
    throw new Error("Set an end time greater than the trim start time.");
  }

  const inputName = `input.${getExtension(options.inputBlob.type)}`;
  const outputName = "output.mp4";
  const outputWebmName = "output.webm";

  options.onProgress?.(4);
  const progressHandler = ({ progress }: { progress: number }) => {
    options.onProgress?.(Math.round(Math.min(Math.max(progress * 100, 5), 98)));
  };

  ffmpeg.on("progress", progressHandler);

  await safeDelete(inputName);
  await safeDelete(outputName);
  await safeDelete(outputWebmName);
  await ffmpeg.writeFile(inputName, await fetchFile(options.inputBlob));

  const mp4Args = buildCommand(inputName, outputName, options, "mp4");

  try {
    await ffmpeg.exec(mp4Args);
    const data = await ffmpeg.readFile(outputName);
    options.onProgress?.(100);
    return new Blob([toArrayBuffer(data as Uint8Array)], { type: "video/mp4" });
  } catch (error) {
    await safeDelete(outputName);
    const webmArgs = buildCommand(inputName, outputWebmName, options, "webm");

    try {
      await ffmpeg.exec(webmArgs);
      const data = await ffmpeg.readFile(outputWebmName);
      options.onProgress?.(100);
      return new Blob([toArrayBuffer(data as Uint8Array)], { type: "video/webm" });
    } catch {
      throw new Error(
        error instanceof Error
          ? `Export failed: ${error.message}`
          : "Export failed. Try a shorter clip or fewer effects."
      );
    }
  } finally {
    ffmpeg.off("progress", progressHandler);
    await safeDelete(inputName);
  }
}

async function loadFFmpegInternal(): Promise<void> {
  ffmpeg = new FFmpeg();

  try {
    const baseUrl = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseUrl}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseUrl}/ffmpeg-core.wasm`, "application/wasm")
    });
  } catch (error) {
    loadPromise = null;
    throw new Error(
      error instanceof Error
        ? `FFmpeg failed to load: ${error.message}`
        : "FFmpeg failed to load in this browser."
    );
  }
}

function buildCommand(
  inputName: string,
  outputName: string,
  options: ExportOptions,
  format: "mp4" | "webm"
): string[] {
  const args: string[] = [];
  const duration = Math.max(0.1, options.trimEnd - options.trimStart);
  const videoFilters = buildVideoFilters(options);
  const audioFilters = buildAudioFilters(options);

  if (options.trimStart > 0) {
    args.push("-ss", formatTime(options.trimStart));
  }

  args.push("-i", inputName, "-t", formatTime(duration));

  if (videoFilters.length > 0) {
    args.push("-filter:v", videoFilters.join(","));
  }

  if (options.muted) {
    args.push("-an");
  } else if (audioFilters.length > 0) {
    args.push("-filter:a", audioFilters.join(","));
  }

  args.push("-map", "0:v:0");
  if (!options.muted) {
    args.push("-map", "0:a?");
  }

  if (format === "mp4") {
    args.push(
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-movflags",
      "+faststart"
    );
  } else {
    args.push("-c:v", "libvpx-vp9", "-b:v", "2500k", "-c:a", "libopus");
  }

  args.push("-shortest", outputName);
  return args;
}

function buildVideoFilters(options: ExportOptions): string[] {
  const filters: string[] = [];

  if (options.aspectRatio === "9:16") {
    filters.push("scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920");
  }

  if (options.aspectRatio === "1:1") {
    filters.push("scale=1080:1080:force_original_aspect_ratio=increase,crop=1080:1080");
  }

  if (options.aspectRatio === "16:9") {
    filters.push("scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080");
  }

  if (options.brightness !== 0 || options.contrast !== 1 || options.saturation !== 1) {
    filters.push(
      `eq=brightness=${options.brightness.toFixed(2)}:contrast=${options.contrast.toFixed(
        2
      )}:saturation=${options.saturation.toFixed(2)}`
    );
  }

  if (options.speed !== 1) {
    filters.push(`setpts=PTS/${options.speed}`);
  }

  const overlayFilters = buildOverlayFilters(options);
  filters.push(...overlayFilters);

  return filters;
}

function buildAudioFilters(options: ExportOptions): string[] {
  const filters: string[] = [];

  if (options.speed !== 1) {
    filters.push(...buildAtempoChain(options.speed));
  }

  if (options.volume !== 1) {
    filters.push(`volume=${options.volume.toFixed(2)}`);
  }

  return filters;
}

function buildOverlayFilters(options: ExportOptions): string[] {
  const filters: string[] = [];

  if (options.textOverlay?.text.trim()) {
    filters.push(
      buildDrawTextFilter({
        text: options.textOverlay.text,
        fontSize: options.textOverlay.fontSize,
        color: options.textOverlay.color,
        position: options.textOverlay.position
      })
    );
  }

  options.subtitles?.forEach((subtitle) => {
    if (!subtitle.text.trim()) return;
    filters.push(
      buildDrawTextFilter({
        text: subtitle.text,
        fontSize: 42,
        color: "#ffffff",
        position: "bottom",
        enable: `between(t\\,${subtitle.start}\\,${subtitle.end})`,
        boxed: true
      })
    );
  });

  return filters;
}

function buildDrawTextFilter(input: {
  text: string;
  fontSize: number;
  color: string;
  position: "top" | "center" | "bottom";
  enable?: string;
  boxed?: boolean;
}): string {
  const y =
    input.position === "top"
      ? "h*0.12"
      : input.position === "center"
        ? "(h-text_h)/2"
        : "h-text_h-160";

  const parts = [
    "drawtext",
    `text='${escapeDrawText(input.text)}'`,
    `fontsize=${input.fontSize}`,
    `fontcolor=${toFfmpegColor(input.color)}`,
    "x=(w-text_w)/2",
    `y=${y}`
  ];

  if (input.boxed) {
    parts.push("box=1", "boxcolor=black@0.52", "boxborderw=24");
  }

  if (input.enable) {
    parts.push(`enable='${input.enable}'`);
  }

  return parts.join(":");
}

function buildAtempoChain(speed: number): string[] {
  const filters: string[] = [];
  let remaining = speed;

  while (remaining > 2) {
    filters.push("atempo=2");
    remaining /= 2;
  }

  while (remaining < 0.5) {
    filters.push("atempo=0.5");
    remaining /= 0.5;
  }

  filters.push(`atempo=${remaining.toFixed(2)}`);
  return filters;
}

function formatTime(value: number): string {
  return Math.max(0, value).toFixed(3);
}

function getExtension(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("quicktime")) return "mov";
  return "mp4";
}

function escapeDrawText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/:/g, "\\:")
    .replace(/,/g, "\\,")
    .replace(/\n/g, " ");
}

function toFfmpegColor(color: string): string {
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    return `0x${color.slice(1)}`;
  }

  return "white";
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function safeDelete(path: string): Promise<void> {
  if (!ffmpeg) return;

  try {
    await ffmpeg.deleteFile(path);
  } catch {
    // The file often does not exist yet. That is fine before a fresh export.
  }
}
