/**
 * Parse a spoken (or typed) reminder into a scheduled time and a label.
 *
 * Pure and browser-safe: chrono only, no network.
 * (The Anthropic Sonnet label polish in src/lib/ai/reminder-parse.ts is
 * server-only and deferred; the cleaned chrono label is what we store.)
 *
 * Edge cases: reject a date in the past; reject when no date is found. Never
 * write a malformed reminder silently: the overlay surfaces these errors.
 */

import * as chrono from "chrono-node";

export interface ParsedReminder {
  scheduledFor: number; // UTC ms
  label: string;
}

export function parseReminder(
  transcript: string,
  now: Date = new Date(),
): ParsedReminder {
  const results = chrono.parse(transcript, now, { forwardDate: true });
  if (results.length === 0) {
    throw new Error(
      'I could not find a date or time. Try something like "Sunday at 7pm".',
    );
  }

  const date = results[0].start.date();
  if (date.getTime() < now.getTime()) {
    throw new Error("That time is in the past. Try a future time.");
  }

  const label = cleanLabel(transcript.replace(results[0].text, " "));
  return { scheduledFor: date.getTime(), label: label || "Review this moment" };
}

/**
 * Strip the spoken scaffolding ("remind me to ...") left after the date phrase
 * is removed, leaving the thing to remember.
 */
function cleanLabel(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^remind me( to)?\s*/i, "")
    .replace(/^to\s+/i, "")
    .trim();
}
