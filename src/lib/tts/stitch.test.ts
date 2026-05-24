import { test } from "node:test";
import assert from "node:assert/strict";
import { stitchAudio } from "./stitch";

test("concatenates audio bytes in order", () => {
  const r = stitchAudio([
    { lineId: "a", audioBytes: new Uint8Array([1, 2]), durationMs: 100 },
    { lineId: "b", audioBytes: new Uint8Array([3, 4, 5]), durationMs: 200 },
  ]);
  assert.deepEqual([...r.audioBytes], [1, 2, 3, 4, 5]);
});

test("timing marks are cumulative and contiguous", () => {
  const r = stitchAudio([
    { lineId: "a", audioBytes: new Uint8Array([0]), durationMs: 100 },
    { lineId: "b", audioBytes: new Uint8Array([0]), durationMs: 250 },
    { lineId: "c", audioBytes: new Uint8Array([0]), durationMs: 50 },
  ]);
  assert.deepEqual(r.timingMarks, [
    { lineId: "a", startMs: 0, endMs: 100 },
    { lineId: "b", startMs: 100, endMs: 350 },
    { lineId: "c", startMs: 350, endMs: 400 },
  ]);
  assert.equal(r.totalDurationMs, 400);
});

test("marks are sorted ascending by startMs (the player relies on this)", () => {
  const r = stitchAudio([
    { lineId: "a", audioBytes: new Uint8Array([0]), durationMs: 100 },
    { lineId: "b", audioBytes: new Uint8Array([0]), durationMs: 100 },
    { lineId: "c", audioBytes: new Uint8Array([0]), durationMs: 100 },
  ]);
  for (let i = 1; i < r.timingMarks.length; i++) {
    assert.ok(r.timingMarks[i].startMs >= r.timingMarks[i - 1].startMs);
  }
});

test("empty input is safe", () => {
  const r = stitchAudio([]);
  assert.equal(r.totalDurationMs, 0);
  assert.equal(r.audioBytes.byteLength, 0);
  assert.deepEqual(r.timingMarks, []);
});
