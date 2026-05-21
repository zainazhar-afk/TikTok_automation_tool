export type AspectRatio = "original" | "9:16" | "1:1" | "16:9";

export type TextOverlayPosition = "top" | "center" | "bottom";

export type TextOverlay = {
  text: string;
  fontSize: number;
  position: TextOverlayPosition;
  color: string;
};

export type SubtitleLine = {
  id: string;
  start: number;
  end: number;
  text: string;
};

export type EditorState = {
  selectedVideoId: string | null;
  selectedVideoBlob: Blob | null;
  previewUrl: string | null;
  trimStart: number;
  trimEnd: number;
  speed: number;
  brightness: number;
  contrast: number;
  saturation: number;
  aspectRatio: AspectRatio;
  volume: number;
  muted: boolean;
  textOverlay: TextOverlay;
  subtitles: SubtitleLine[];
  isExporting: boolean;
  exportProgress: number;
};
