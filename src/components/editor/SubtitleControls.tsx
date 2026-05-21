"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { formatDuration } from "@/lib/videoUtils";
import { useEditorStore } from "@/store/editorStore";

export function SubtitleControls() {
  const { subtitles, addSubtitle, updateSubtitle, deleteSubtitle } = useEditorStore();
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(3);
  const [text, setText] = useState("");

  function handleAdd() {
    if (!text.trim() || end <= start) return;

    addSubtitle({
      start,
      end,
      text: text.trim()
    });
    setStart(end);
    setEnd(end + 3);
    setText("");
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-white">Subtitles</h3>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-medium text-slate-400">
          Start
          <Input
            className="mt-1"
            type="number"
            min={0}
            step={0.1}
            value={start}
            onChange={(event) => setStart(Number(event.target.value))}
          />
        </label>
        <label className="text-xs font-medium text-slate-400">
          End
          <Input
            className="mt-1"
            type="number"
            min={0}
            step={0.1}
            value={end}
            onChange={(event) => setEnd(Number(event.target.value))}
          />
        </label>
      </div>
      <label className="text-xs font-medium text-slate-400">
        Manual subtitle
        <Input
          className="mt-1"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Subtitle line"
        />
      </label>
      <Button size="sm" onClick={handleAdd} disabled={!text.trim() || end <= start}>
        <Plus className="h-4 w-4" />
        Add subtitle line
      </Button>

      <div className="space-y-2">
        {subtitles.map((subtitle) => (
          <div key={subtitle.id} className="rounded-lg border border-white/10 bg-slate-950/45 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">
                {formatDuration(subtitle.start)} to {formatDuration(subtitle.end)}
              </span>
              <Button variant="ghost" size="sm" onClick={() => deleteSubtitle(subtitle.id)} aria-label="Delete subtitle">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input
              value={subtitle.text}
              onChange={(event) => updateSubtitle(subtitle.id, { text: event.target.value })}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
