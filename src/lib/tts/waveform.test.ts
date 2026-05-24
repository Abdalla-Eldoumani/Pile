import { test } from "node:test";
import assert from "node:assert/strict";
import { computeWaveform, WAVEFORM_BUCKETS } from "./waveform";

function avg(a: number[]): number {
  return a.reduce((s, x) => s + x, 0) / a.length;
}

test("always returns the fixed bucket count", () => {
  assert.equal(computeWaveform([], 0).length, WAVEFORM_BUCKETS);
  assert.equal(
    computeWaveform([{ startMs: 0, endMs: 1000 }], 2000).length,
    WAVEFORM_BUCKETS,
  );
});

test("all amplitudes are finite and within [0, 1]", () => {
  const timings = Array.from({ length: 50 }, (_, i) => ({
    startMs: i * 100,
    endMs: i * 100 + 60,
  }));
  for (const v of computeWaveform(timings, 5000)) {
    assert.ok(Number.isFinite(v), "amplitude must be finite");
    assert.ok(v >= 0 && v <= 1, `amplitude ${v} out of range`);
  }
});

test("empty timings or zero duration give a flat floor (no NaN)", () => {
  for (const v of computeWaveform([], 0)) {
    assert.ok(Number.isFinite(v) && v >= 0 && v <= 1);
  }
});

test("a spoken stretch reads louder than the silent one", () => {
  // Dense speech only in the first second of a two-second clip.
  const timings = Array.from({ length: 100 }, (_, i) => ({
    startMs: i * 10,
    endMs: i * 10 + 9,
  }));
  const w = computeWaveform(timings, 2000);
  const spoken = avg(w.slice(0, WAVEFORM_BUCKETS / 2));
  const silent = avg(w.slice(WAVEFORM_BUCKETS / 2));
  assert.ok(spoken > silent, "the spoken half should average louder");
});
