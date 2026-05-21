"use client";

import { useEditorStore } from "@/store/editorStore";

export function ColorControls() {
  const { brightness, contrast, saturation, setBrightness, setContrast, setSaturation } =
    useEditorStore();

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-white">Color</h3>
      <Slider label="Brightness" min={-0.4} max={0.4} step={0.01} value={brightness} onChange={setBrightness} />
      <Slider label="Contrast" min={0.5} max={1.8} step={0.01} value={contrast} onChange={setContrast} />
      <Slider label="Saturation" min={0.4} max={2} step={0.01} value={saturation} onChange={setSaturation} />
    </section>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-xs font-medium text-slate-400">
      <span className="flex justify-between">
        {label}
        <span className="text-slate-300">{value.toFixed(2)}</span>
      </span>
      <input
        className="mt-2 w-full"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
