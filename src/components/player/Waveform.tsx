"use client";

import type { PointerEvent } from "react";

/**
 * The waveform: 600 amplitude bars rendered as SVG. Played region in --accent,
 * unplayed in --ink-muted. Click or drag-tap anywhere to seek.
 */
export function Waveform({
  waveform,
  progress,
  onSeek,
}: {
  waveform: number[];
  progress: number; // 0..1
  onSeek: (fraction: number) => void;
}) {
  const n = waveform.length || 1;
  const H = 40;

  function seek(e: PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0) return;
    const f = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onSeek(f);
  }

  return (
    <svg
      viewBox={`0 0 ${n} ${H}`}
      preserveAspectRatio="none"
      className="w-full h-10 cursor-pointer select-none"
      onPointerDown={seek}
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress * 100)}
    >
      {waveform.map((a, i) => {
        const barH = Math.max(1, a * H);
        const played = (i + 1) / n <= progress;
        return (
          <rect
            key={i}
            x={i + 0.15}
            y={(H - barH) / 2}
            width={0.7}
            height={barH}
            rx={0.3}
            fill={played ? "var(--color-accent)" : "var(--color-ink-muted)"}
          />
        );
      })}
    </svg>
  );
}
