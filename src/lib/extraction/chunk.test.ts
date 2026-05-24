import { test } from "node:test";
import assert from "node:assert/strict";
import { chunkText } from "./chunk";

function makeText(n: number): string {
  let s = "";
  let i = 0;
  while (s.length < n) {
    s += `This is sentence number ${i}. `;
    i++;
  }
  return s.slice(0, n);
}

test("every character is covered by at least one chunk (no gaps)", () => {
  const text = makeText(5000);
  const chunks = chunkText(text, {
    itemId: "it",
    targetTokens: 100,
    overlapTokens: 10,
  });
  assert.ok(chunks.length > 1, "should produce multiple chunks");
  const covered = new Array(text.length).fill(false);
  for (const c of chunks) {
    for (let i = c.charStart; i < c.charEnd; i++) covered[i] = true;
  }
  const firstGap = covered.indexOf(false);
  assert.equal(firstGap, -1, `char ${firstGap} is not covered by any chunk`);
});

test("consecutive chunks overlap so a citation never falls in a seam", () => {
  const chunks = chunkText(makeText(5000), {
    itemId: "it",
    targetTokens: 100,
    overlapTokens: 10,
  });
  for (let i = 1; i < chunks.length; i++) {
    assert.ok(
      chunks[i].charStart < chunks[i - 1].charEnd,
      `chunk ${i} does not overlap the previous one`,
    );
  }
});

test("chunk ids are stable and ranges are well formed", () => {
  const chunks = chunkText(makeText(3000), { itemId: "abc", targetTokens: 100 });
  assert.equal(chunks[0].id, "abc_0000");
  for (const c of chunks) {
    assert.equal(c.itemId, "abc");
    assert.ok(c.charEnd > c.charStart);
    assert.ok(c.text.length > 0);
  }
});

test("short text yields a single chunk", () => {
  const chunks = chunkText("Just a short note.", { itemId: "x" });
  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].text, "Just a short note.");
});

test("empty or whitespace-only text yields no chunks", () => {
  assert.deepEqual(chunkText("", { itemId: "x" }), []);
  assert.deepEqual(chunkText("    ", { itemId: "x" }), []);
});
