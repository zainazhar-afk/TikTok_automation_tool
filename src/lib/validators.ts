import type { ChannelUrlParseResult } from "@/types/youtube";

const SUPPORTED_VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const SUPPORTED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm"];
const MAX_VIDEO_SIZE_BYTES = 1024 * 1024 * 1024;

export function parseYouTubeChannelUrl(channelUrl: string): ChannelUrlParseResult {
  const trimmed = channelUrl.trim();

  if (!trimmed) {
    throw new Error("Enter a YouTube channel URL first.");
  }

  const normalized = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  let url: URL;

  try {
    url = new URL(normalized);
  } catch {
    throw new Error("Enter a valid YouTube channel URL.");
  }

  const host = url.hostname.replace(/^www\./, "");
  if (!["youtube.com", "m.youtube.com"].includes(host)) {
    throw new Error("Use a youtube.com channel URL.");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  const channelIndex = parts.indexOf("channel");

  if (channelIndex >= 0 && parts[channelIndex + 1]?.startsWith("UC")) {
    return {
      type: "channelId",
      value: parts[channelIndex + 1]
    };
  }

  const handlePart = parts.find((part) => part.startsWith("@"));
  if (handlePart && handlePart.length > 1) {
    return {
      type: "handle",
      value: handlePart.replace(/^@/, "")
    };
  }

  throw new Error("Use a /channel/UC... URL or a @handle YouTube channel URL.");
}

export function validateVideoFile(file: File): void {
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  const hasSupportedType = SUPPORTED_VIDEO_TYPES.has(file.type);
  const hasSupportedExtension = SUPPORTED_VIDEO_EXTENSIONS.includes(extension);

  if (!hasSupportedType && !hasSupportedExtension) {
    throw new Error("Upload an MP4, MOV, or WebM video file.");
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    throw new Error("This MVP supports local videos up to 1 GB.");
  }
}
