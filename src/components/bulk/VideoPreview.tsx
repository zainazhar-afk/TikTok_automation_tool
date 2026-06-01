"use client";

import { useEffect, useMemo } from "react";
import { X } from "lucide-react";

type VideoPreviewProps = {
  blob?: Blob;
  tempId?: string;
  name: string;
  onClose: () => void;
};

export function VideoPreview({ blob, tempId, name, onClose }: VideoPreviewProps) {
  const url = useMemo(() => {
    if (tempId) {
      return `/api/videos/download/${tempId}`;
    }
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return null;
  }, [blob, tempId]);

  useEffect(() => {
    return () => {
      if (url?.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    };
  }, [url]);

  if (!url) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-xl border border-white/10 bg-studio-900 p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="truncate pr-4 text-sm font-medium text-white">{name}</p>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <video
          src={url}
          controls
          autoPlay
          className="max-h-[70vh] w-full rounded-lg"
        />
      </div>
    </div>
  );
}
