/**
 * Generate an .ics calendar file from a Reminder.
 *
 * Implements T7.8 in TASKS.md. Pure function.
 *
 * EDGE_CASES.md: must include DTSTAMP; must use CRLF line endings; tested
 * against both Google Calendar AND Apple Calendar before shipping.
 */

import { createEvent, type EventAttributes } from "ics";
import type { Reminder } from "@/lib/types";

export interface IcsBuildOptions {
  baseUrl: string;  // for the deep link, e.g. https://pile.app
}

export function buildIcs(reminder: Reminder, opts: IcsBuildOptions): string {
  const start = new Date(reminder.scheduledFor);

  const event: EventAttributes = {
    title: reminder.label,
    description: [
      reminder.chunkExcerpt ?? "",
      "",
      `Listen from this moment: ${opts.baseUrl}/episode/${reminder.episodeId}?t=${reminder.audioAnchorMs}`,
    ].join("\n"),
    url: `${opts.baseUrl}/reminders/${reminder.id}`,
    start: [
      start.getUTCFullYear(),
      start.getUTCMonth() + 1,
      start.getUTCDate(),
      start.getUTCHours(),
      start.getUTCMinutes(),
    ],
    startInputType: "utc",
    duration: { minutes: 15 },
    productId: "pile/ics",
    uid: `pile-reminder-${reminder.id}@pile.app`,
    status: "CONFIRMED",
  };

  const { error, value } = createEvent(event);
  if (error || !value) {
    throw new Error(`Failed to build .ics: ${error?.message ?? "unknown"}`);
  }
  // The `ics` package emits CRLF already, but verify against EDGE_CASES.md
  // before shipping.
  return value;
}
