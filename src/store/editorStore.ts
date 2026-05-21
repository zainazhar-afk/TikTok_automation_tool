"use client";

import { create } from "zustand";
import type { AspectRatio, EditorState, SubtitleLine, TextOverlay } from "@/types/editor";

type EditorActions = {
  setSelectedVideo: (id: string, blob: Blob, previewUrl?: string) => void;
  setTrimStart: (value: number) => void;
  setTrimEnd: (value: number) => void;
  setSpeed: (value: number) => void;
  setBrightness: (value: number) => void;
  setContrast: (value: number) => void;
  setSaturation: (value: number) => void;
  setAspectRatio: (value: AspectRatio) => void;
  setVolume: (value: number) => void;
  setMuted: (value: boolean) => void;
  setTextOverlay: (value: Partial<TextOverlay>) => void;
  addSubtitle: (line: Omit<SubtitleLine, "id">) => void;
  updateSubtitle: (id: string, line: Partial<Omit<SubtitleLine, "id">>) => void;
  deleteSubtitle: (id: string) => void;
  setExporting: (value: boolean) => void;
  setExportProgress: (value: number) => void;
  resetEditor: () => void;
};

const initialState: EditorState = {
  selectedVideoId: null,
  selectedVideoBlob: null,
  previewUrl: null,
  trimStart: 0,
  trimEnd: 30,
  speed: 1,
  brightness: 0,
  contrast: 1,
  saturation: 1,
  aspectRatio: "9:16",
  volume: 1,
  muted: false,
  textOverlay: {
    text: "",
    fontSize: 52,
    position: "bottom",
    color: "#ffffff"
  },
  subtitles: [],
  isExporting: false,
  exportProgress: 0
};

export const useEditorStore = create<EditorState & EditorActions>((set, get) => ({
  ...initialState,
  setSelectedVideo: (id, blob, previewUrl) => {
    const previousUrl = get().previewUrl;
    if (previousUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previousUrl);
    }

    set({
      selectedVideoId: id,
      selectedVideoBlob: blob,
      previewUrl: previewUrl ?? URL.createObjectURL(blob),
      exportProgress: 0
    });
  },
  setTrimStart: (value) => set({ trimStart: Math.max(0, value) }),
  setTrimEnd: (value) => set({ trimEnd: Math.max(0, value) }),
  setSpeed: (value) => set({ speed: value }),
  setBrightness: (value) => set({ brightness: value }),
  setContrast: (value) => set({ contrast: value }),
  setSaturation: (value) => set({ saturation: value }),
  setAspectRatio: (value) => set({ aspectRatio: value }),
  setVolume: (value) => set({ volume: Math.min(Math.max(value, 0), 2) }),
  setMuted: (value) => set({ muted: value }),
  setTextOverlay: (value) =>
    set((state) => ({
      textOverlay: {
        ...state.textOverlay,
        ...value
      }
    })),
  addSubtitle: (line) =>
    set((state) => ({
      subtitles: [
        ...state.subtitles,
        {
          ...line,
          id: createId()
        }
      ]
    })),
  updateSubtitle: (id, line) =>
    set((state) => ({
      subtitles: state.subtitles.map((subtitle) =>
        subtitle.id === id ? { ...subtitle, ...line } : subtitle
      )
    })),
  deleteSubtitle: (id) =>
    set((state) => ({
      subtitles: state.subtitles.filter((subtitle) => subtitle.id !== id)
    })),
  setExporting: (value) => set({ isExporting: value }),
  setExportProgress: (value) => set({ exportProgress: Math.min(Math.max(value, 0), 100) }),
  resetEditor: () => {
    const previousUrl = get().previewUrl;
    if (previousUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previousUrl);
    }
    set(initialState);
  }
}));

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
