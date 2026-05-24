import { test } from "node:test";
import assert from "node:assert/strict";
import { buildIcs } from "./ics";
import type { Reminder } from "@/lib/types";

const reminder: Reminder = {
  id: "rem1",
  userId: "u1",
  scheduledFor: Date.UTC(2026, 4, 24, 19, 0),
  label: "Review attention sinks",
  episodeId: "ep1",
  audioAnchorMs: 123000,
  status: "pending",
  createdAt: Date.UTC(2026, 4, 23, 12, 0),
};

test("produces a VEVENT with the reminder label as the summary", () => {
  const ics = buildIcs(reminder, { baseUrl: "https://pile.app" });
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /BEGIN:VEVENT/);
  assert.match(ics, /SUMMARY:Review attention sinks/);
});

test("includes a DTSTAMP and CRLF line endings", () => {
  const ics = buildIcs(reminder, { baseUrl: "https://pile.app" });
  assert.match(ics, /DTSTAMP:/);
  assert.ok(ics.includes("\r\n"), "ics must use CRLF endings");
});

test("embeds the play-from-this-moment deep link", () => {
  // Unfold ICS line folding (CRLF + leading space) before matching the URL.
  const ics = buildIcs(reminder, { baseUrl: "https://pile.app" }).replace(
    /\r\n[ \t]/g,
    "",
  );
  assert.match(ics, /episode\/ep1\?t=123000/);
});
