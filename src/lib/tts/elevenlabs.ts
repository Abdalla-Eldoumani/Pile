/**
 * ElevenLabs TTS with character-level timestamps.
 *
 * Implements T5.1 in TASKS.md. Server-only: runs inside a Convex "use node"
 * action (the SDK pulls in Node built-ins, like the Anthropic SDK).
 *
 * Package: @elevenlabs/elevenlabs-js 2.47.x. Model: eleven_flash_v2_5.
 * Voice ids: ELEVENLABS_VEGA_VOICE_ID / ELEVENLABS_THEO_VOICE_ID (Convex env).
 */

import * as ElevenLabsSDK from "@elevenlabs/elevenlabs-js";
import type { Speaker } from "@/lib/types";

export interface LineSynthesisResult {
  audioBytes: Uint8Array;       // mp3 bytes
  charTimings: Array<{ char: string; startMs: number; endMs: number }>;
  durationMs: number;
}

// The package root types do not surface the ElevenLabsClient class (its wrapper
// re-export is dropped under moduleResolution "bundler"), though it exists at
// runtime. Type the slice we use and cast through it, rather than reach into a
// fragile dist subpath.
interface TimestampsResponse {
  audioBase64: string;
  alignment?: {
    characters: string[];
    characterStartTimesSeconds: number[];
    characterEndTimesSeconds: number[];
  } | null;
}
interface ElevenLabsLike {
  textToSpeech: {
    convertWithTimestamps(
      voiceId: string,
      body: { text: string; modelId?: string; outputFormat?: string },
    ): Promise<TimestampsResponse>;
  };
}
const ElevenLabsClient = (
  ElevenLabsSDK as unknown as {
    ElevenLabsClient: new (opts: { apiKey?: string }) => ElevenLabsLike;
  }
).ElevenLabsClient;

export async function synthesizeLine(
  text: string,
  speaker: Speaker,
): Promise<LineSynthesisResult> {
  const voiceId =
    speaker === "vega"
      ? process.env.ELEVENLABS_VEGA_VOICE_ID
      : process.env.ELEVENLABS_THEO_VOICE_ID;

  if (!voiceId) {
    throw new Error(
      `Missing ELEVENLABS_${speaker.toUpperCase()}_VOICE_ID in the Convex environment.`,
    );
  }

  const client = new ElevenLabsClient({
    apiKey: process.env.ELEVENLABS_API_KEY,
  });

  const result = await client.textToSpeech.convertWithTimestamps(voiceId, {
    text,
    modelId: "eleven_flash_v2_5",
    outputFormat: "mp3_44100_128",
  });

  const audioBytes = new Uint8Array(Buffer.from(result.audioBase64, "base64"));

  const a = result.alignment;
  const charTimings =
    a && a.characters.length > 0
      ? a.characters.map((char, i) => ({
          char,
          startMs: (a.characterStartTimesSeconds[i] ?? 0) * 1000,
          endMs: (a.characterEndTimesSeconds[i] ?? 0) * 1000,
        }))
      : [];

  // Duration from the last char end; if alignment is missing (rare), estimate
  // from text length so stitching never gets a zero-length line.
  const durationMs =
    charTimings.length > 0
      ? charTimings[charTimings.length - 1].endMs
      : Math.max(500, text.length * 60);

  return { audioBytes, charTimings, durationMs };
}
