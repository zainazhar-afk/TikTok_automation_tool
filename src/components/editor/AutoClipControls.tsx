"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/common/Button";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { suggestBestClipFromBlob, type SuggestedClip } from "@/lib/audioAnalysis";
import { formatDuration } from "@/lib/videoUtils";
import { useEditorStore } from "@/store/editorStore";

const clipLengths = [15, 30, 60];

export function AutoClipControls({ duration }: { duration: number }) {
  const {
    selectedVideoBlob,
    trimStart,
    trimEnd,
    setTrimStart,
    setTrimEnd
  } = useEditorStore();
  const [targetDuration, setTargetDuration] = useState(30);
  const [suggestion, setSuggestion] = useState<SuggestedClip | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");

  async function handleSuggest() {
    if (!selectedVideoBlob) {
      setError("Choose a local source video before generating a suggested clip.");
      return;
    }

    setError("");
    setIsAnalyzing(true);

    try {
      const nextSuggestion = await suggestBestClipFromBlob(selectedVideoBlob, {
        targetDuration,
        videoDuration: duration
      });

      setSuggestion(nextSuggestion);
      setTrimStart(nextSuggestion.start);
      setTrimEnd(nextSuggestion.end);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to suggest a clip.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-studio-mint/20 bg-studio-mint/[0.06] p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-studio-mint" />
        <h3 className="text-sm font-semibold text-white">Auto Suggested Clip</h3>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {clipLengths.map((length) => (
          <button
            key={length}
            type="button"
            onClick={() => setTargetDuration(length)}
            className={`h-9 rounded-lg border text-sm font-semibold transition ${
              targetDuration === length
                ? "border-studio-mint bg-studio-mint text-slate-950"
                : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
            }`}
          >
            {length}s
          </button>
        ))}
      </div>
      <Button
        className="w-full"
        variant="secondary"
        onClick={handleSuggest}
        disabled={isAnalyzing || !selectedVideoBlob}
      >
        <Sparkles className="h-4 w-4" />
        {isAnalyzing ? "Analyzing Audio" : "Find Best Segment"}
      </Button>
      <div className="rounded-lg bg-slate-950/45 p-3 text-xs leading-5 text-slate-400">
        Current trim: {formatDuration(trimStart)} to {formatDuration(trimEnd)}. Best for clips
        under 20 minutes or 250 MB.
      </div>
      {suggestion ? (
        <div className="rounded-lg border border-studio-mint/20 bg-slate-950/45 p-3 text-xs leading-5 text-slate-300">
          Suggested {formatDuration(suggestion.start)} to {formatDuration(suggestion.end)}.
          Score {suggestion.score}/100. {suggestion.reason}
        </div>
      ) : null}
      {error ? <ErrorMessage message={error} /> : null}
    </section>
  );
}
