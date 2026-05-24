import { test } from "node:test";
import assert from "node:assert/strict";
import { finalizeLines } from "./script";

// finalizeLines enforces the citation contract: a line may only keep a citation
// that points at a chunk id present in the input. This is the guard that keeps
// temporal anchoring honest, so it is the most important pure function to test.
const valid = new Set(["c1", "c2"]);

test("keeps a citation that references a real chunk", () => {
  const { lines, invalidCitations } = finalizeLines(
    [{ speaker: "vega", text: "hi", citation: { itemId: "i1", chunkId: "c1" } }],
    valid,
    "ep",
  );
  assert.equal(invalidCitations, 0);
  assert.deepEqual(lines[0].citation, { itemId: "i1", chunkId: "c1" });
});

test("drops a hallucinated chunk id and counts it (the line becomes filler)", () => {
  const { lines, invalidCitations } = finalizeLines(
    [
      {
        speaker: "theo",
        text: "made up",
        citation: { itemId: "i1", chunkId: "ghost" },
      },
    ],
    valid,
    "ep",
  );
  assert.equal(invalidCitations, 1);
  assert.equal(lines[0].citation, undefined);
});

test("assigns stable ids and sequential indices", () => {
  const { lines } = finalizeLines(
    [
      { speaker: "vega", text: "a" },
      { speaker: "theo", text: "b" },
    ],
    valid,
    "ep9",
  );
  assert.equal(lines[0].id, "ep9_0");
  assert.equal(lines[1].id, "ep9_1");
  assert.equal(lines[1].index, 1);
});

test("a line with no citation stays filler and is not counted invalid", () => {
  const { lines, invalidCitations } = finalizeLines(
    [{ speaker: "vega", text: "transition" }],
    valid,
    "ep",
  );
  assert.equal(invalidCitations, 0);
  assert.equal(lines[0].citation, undefined);
});
