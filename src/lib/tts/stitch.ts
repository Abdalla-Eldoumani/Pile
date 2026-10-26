/**
 * Stitch per-line audio into a single MP3 with TimingMarks.
 *
 * Pure function.
 *
 * For MP3 concatenation, simple byte concat works in practice (MP3 is
 * a stream format) for files from the same encoder + bitrate. This is
 * the case for ElevenLabs eleven_flash_v2_5 at mp3_44100_128.
 *
 * We do NOT re-encode. We DO recompute durations from the per-line
 * results because byte-concatenation does not produce a valid duration
 * header that browsers can read precisely.
 */

import type { TimingMark } from "@/lib/types";

export interface PerLineAudio {
  lineId: string;
  audioBytes: Uint8Array;
  durationMs: number;
}

export interface StitchResult {
  audioBytes: Uint8Array;
  timingMarks: TimingMark[];
  totalDurationMs: number;
}

export function stitchAudio(lines: PerLineAudio[]): StitchResult {
  // Compute timing marks first; concat audio second.
  const marks: TimingMark[] = [];
  let cursor = 0;
  for (const line of lines) {
    marks.push({
      lineId: line.lineId,
      startMs: cursor,
      endMs: cursor + line.durationMs,
    });
    cursor += line.durationMs;
  }

  // Concat bytes.
  const totalLen = lines.reduce((sum, l) => sum + l.audioBytes.byteLength, 0);
  const out = new Uint8Array(totalLen);
  let offset = 0;
  for (const line of lines) {
    out.set(line.audioBytes, offset);
    offset += line.audioBytes.byteLength;
  }

  return { audioBytes: out, timingMarks: marks, totalDurationMs: cursor };
}
