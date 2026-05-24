import { test } from "node:test";
import assert from "node:assert/strict";
import { parseReminder } from "./parse";

const NOW = new Date("2026-05-23T12:00:00");

test("parses a future time and strips the spoken scaffolding from the label", () => {
  const r = parseReminder(
    "remind me tomorrow at 9am to review the attention section",
    NOW,
  );
  assert.ok(r.scheduledFor > NOW.getTime());
  assert.ok(!/remind me/i.test(r.label), "label should not keep 'remind me'");
  assert.ok(/attention/i.test(r.label), "label should keep the subject");
});

test("rejects a time in the past", () => {
  assert.throws(
    () => parseReminder("remind me yesterday at 9am to do this", NOW),
    /past/i,
  );
});

test("rejects input with no date or time", () => {
  assert.throws(
    () => parseReminder("just remember the thing", NOW),
    /date or time/i,
  );
});

test("never stores an empty label", () => {
  const r = parseReminder("tomorrow at 3pm", NOW);
  assert.ok(r.scheduledFor > NOW.getTime());
  assert.ok(r.label.trim().length > 0);
});
