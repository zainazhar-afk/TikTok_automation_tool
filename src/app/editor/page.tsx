import { Suspense } from "react";
import { VideoEditor } from "@/components/editor/VideoEditor";

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-400">Loading editor...</div>}>
      <VideoEditor />
    </Suspense>
  );
}
