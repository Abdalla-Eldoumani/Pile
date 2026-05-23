/**
 * Precompute a 600-bucket amplitude array from an MP3 byte stream.
 *
 * Implements T5.4 in TASKS.md. Server-only (runs inside the Convex action).
 *
 * Strategy: decode the MP3 into PCM samples using a Node-side decoder, then
 * downsample to 600 buckets by taking RMS amplitude per bucket. The result
 * is what <Waveform /> renders as an SVG path.
 *
 * 600 buckets fits the player bar width with 1 to 2 px per bar at standard
 * desktop sizes; we keep this constant so the rendering math is simple.
 */

export const WAVEFORM_BUCKETS = 600;

export function computeWaveform(_mp3Bytes: Uint8Array): number[] {
  // TODO(T5.4):
  //
  // Use a lightweight Node MP3 decoder (e.g. `audio-decode` or `node-lame`)
  // to obtain Float32Array PCM. Then:
  //
  //   const bucketSize = Math.floor(pcm.length / WAVEFORM_BUCKETS);
  //   const out = new Array(WAVEFORM_BUCKETS);
  //   for (let i = 0; i < WAVEFORM_BUCKETS; i++) {
  //     let sumSquares = 0;
  //     for (let j = 0; j < bucketSize; j++) {
  //       const sample = pcm[i * bucketSize + j];
  //       sumSquares += sample * sample;
  //     }
  //     out[i] = Math.sqrt(sumSquares / bucketSize); // RMS, in [0, 1]
  //   }
  //   return out;
  //
  // Convex actions run in Node, so server-only MP3 decoders are fair game.
  throw new Error("computeWaveform not implemented; see T5.4 in TASKS.md");
}
