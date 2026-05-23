/**
 * Parse a spoken reminder into a structured Reminder.
 *
 * Implements T7.2 in TASKS.md.
 *
 * Input: the user's spoken transcript plus the current audio anchor
 * (which chunk was being discussed when they hit the mic).
 *
 * Output: { scheduledFor, label, anchor } ready to write to Convex.
 *
 * The label is refined by Claude Sonnet using the chunk text as
 * context, so "the part about attention sinks" becomes "Attention sinks
 * in transformer architectures (from 'The KV Cache Problem,' p. 4)".
 *
 * EDGE_CASES.md: past dates (refuse), ambiguous AM/PM (default PM after
 * 6 local time), timezone (browser-provided), DST.
 */

import * as chrono from "chrono-node";
import Anthropic from "@anthropic-ai/sdk";

export interface AudioAnchor {
  episodeId: string;
  audioMs: number;
  lineId?: string;
  chunkId?: string;
  chunkExcerpt?: string;
  itemTitle?: string;
}

export interface ParsedReminder {
  scheduledFor: number;     // UTC ms
  label: string;
  anchor: AudioAnchor;
}

export async function parseReminder(
  transcript: string,
  anchor: AudioAnchor,
  now: Date = new Date(),
): Promise<ParsedReminder> {
  // 1. Date parse with chrono. forwardDate=true biases toward the next future occurrence.
  const parsed = chrono.parse(transcript, now, { forwardDate: true });
  if (parsed.length === 0) {
    throw new Error(
      "I couldn't find a date or time in that. Try again with something like \"Sunday at 7 PM\".",
    );
  }
  const date = parsed[0].start.date();
  if (date.getTime() < now.getTime()) {
    throw new Error("That reminder time is in the past. Did you mean next week?");
  }

  // 2. Strip the matched date phrase to get the user's intended label
  //    e.g. "remind me Sunday at 7 PM to review the section about X"
  //         after stripping date words -> "remind me to review the section about X"
  const rawLabel = transcript.replace(parsed[0].text, "").trim();

  // 3. Refine the label using Claude Sonnet + the chunk excerpt context.
  //    Cheap, fast call; one-shot, low temperature.
  const label = await refineLabel(rawLabel, anchor);

  return {
    scheduledFor: date.getTime(),
    label,
    anchor,
  };
}

async function refineLabel(rawLabel: string, anchor: AudioAnchor): Promise<string> {
  // TODO(T7.2): Anthropic call.
  //
  // const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // const response = await client.messages.create({
  //   model: "claude-sonnet-4-6",
  //   max_tokens: 80,
  //   system: "Rewrite the user's spoken reminder into a single concise line (under 80 chars). Use the source excerpt as context. Drop filler like 'remind me to'. Never add information that is not in the source or the user's request.",
  //   messages: [{
  //     role: "user",
  //     content: `User said: "${rawLabel}"\n\nSource excerpt:\n${anchor.chunkExcerpt ?? "(no excerpt)"}\n\nFrom: ${anchor.itemTitle ?? "(unknown)"}`,
  //   }],
  // });
  // return extractText(response).slice(0, 80);
  void Anthropic;
  void anchor;

  // Fallback (T7.2 not implemented yet): return the raw label, stripped of "remind me to".
  return rawLabel.replace(/^remind me( to)?\s*/i, "").trim() || "Review this moment";
}
