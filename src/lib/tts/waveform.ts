/**
 * Precompute a 600-bucket waveform for the player.
 *
 * Pure, server-side (runs in the render action).
 *
 * We derive the waveform from the speech timing ElevenLabs already returns
 * rather than decoding the MP3: amplitude per time bucket = how much of that
 * bucket is spoken (vs a pause). No audio decoder, no native dependency, fully
 * deterministic, and it tracks the real rhythm of the conversation (loud during
 * words, low in the gaps between lines). <Waveform/> renders it as an SVG path.
 */

export const WAVEFORM_BUCKETS = 600;

const FLOOR = 0.12; // silent buckets still show a thin bar
const JITTER = 0.06; // subtle texture so it reads as a waveform, not blocks

export interface CharTiming {
  startMs: number;
  endMs: number;
}

export function computeWaveform(
  charTimings: CharTiming[],
  totalDurationMs: number,
): number[] {
  if (totalDurationMs <= 0 || charTimings.length === 0) {
    // Nothing to measure: a flat, low waveform that still renders.
    return Array.from({ length: WAVEFORM_BUCKETS }, (_, i) =>
      clamp01(FLOOR + jitter(i) * JITTER),
    );
  }

  const bucketMs = totalDurationMs / WAVEFORM_BUCKETS;
  const coverage = new Array<number>(WAVEFORM_BUCKETS).fill(0);

  // Distribute each character's spoken interval across the buckets it touches.
  for (const t of charTimings) {
    const start = Math.max(0, t.startMs);
    const end = Math.max(start, Math.min(totalDurationMs, t.endMs));
    if (end <= start) continue;
    const firstB = Math.floor(start / bucketMs);
    const lastB = Math.min(
      WAVEFORM_BUCKETS - 1,
      Math.floor((end - 1e-6) / bucketMs),
    );
    for (let b = firstB; b <= lastB; b++) {
      const bStart = b * bucketMs;
      const bEnd = bStart + bucketMs;
      coverage[b] += Math.min(end, bEnd) - Math.max(start, bStart);
    }
  }

  // Coverage -> fraction of the bucket spoken -> normalized to a peak of 1.
  let max = 0;
  const frac = coverage.map((c) => {
    const f = c / bucketMs;
    if (f > max) max = f;
    return f;
  });

  return frac.map((f, i) => {
    const norm = max > 0 ? f / max : 0;
    const amp = FLOOR + (1 - FLOOR) * norm;
    return clamp01(amp + jitter(i) * JITTER);
  });
}

/** Deterministic [-1, 1] value from a bucket index. */
function jitter(i: number): number {
  const x = Math.sin((i + 1) * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
