/**
 * ElevenLabs TTS with character-level timestamps.
 *
 * Implements T5.1 in TASKS.md. Server-only (Convex action).
 *
 * Package: @elevenlabs/elevenlabs-js 2.47.x (NOT the old deprecated
 * `elevenlabs` package; it has moved to the @elevenlabs scope).
 *
 * Model: eleven_flash_v2_5 for low latency. ~$0.0003/char.
 *
 * Voice IDs come from env: ELEVENLABS_VEGA_VOICE_ID, ELEVENLABS_THEO_VOICE_ID.
 * See PRE_FLIGHT.md step 6 for how to pick them.
 */

import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import type { Speaker } from "@/lib/types";

export interface LineSynthesisResult {
  audioBytes: Uint8Array;       // mp3 bytes
  charTimings: Array<{ char: string; startMs: number; endMs: number }>;
  durationMs: number;
}

export async function synthesizeLine(
  text: string,
  speaker: Speaker,
): Promise<LineSynthesisResult> {
  const voiceId = speaker === "vega"
    ? process.env.ELEVENLABS_VEGA_VOICE_ID
    : process.env.ELEVENLABS_THEO_VOICE_ID;

  if (!voiceId) {
    throw new Error(
      `Missing ELEVENLABS_${speaker.toUpperCase()}_VOICE_ID. See PRE_FLIGHT.md step 5.`,
    );
  }

  const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  // TODO(T5.1):
  //
  // Use the convertWithTimestamps method (or convert + with_timestamps=true).
  // The SDK API surface for v2.47 returns an object that includes audio bytes
  // and character timing alignment. Check via context7 for the exact method
  // shape; the surface has changed across recent minor versions.
  //
  // Pseudocode:
  // const result = await client.textToSpeech.convertWithTimestamps(voiceId, {
  //   text,
  //   modelId: "eleven_flash_v2_5",
  //   outputFormat: "mp3_44100_128",
  // });
  // return {
  //   audioBytes: new Uint8Array(result.audio),
  //   charTimings: result.alignment.characters.map((c, i) => ({
  //     char: c,
  //     startMs: result.alignment.character_start_times_seconds[i] * 1000,
  //     endMs: result.alignment.character_end_times_seconds[i] * 1000,
  //   })),
  //   durationMs: last endMs in the array,
  // };
  void client;
  void text;
  throw new Error("synthesizeLine not implemented; see T5.1 in TASKS.md");
}
