/**
 * Script generation. The temporal anchoring foundation.
 *
 * Implements T4.1 in TASKS.md.
 *
 * Critical contract: every non-filler DialogueLine MUST carry a
 * { itemId, chunkId } citation. We enforce this with the Anthropic
 * tool use API: the model returns lines via a structured tool, not
 * via free text. If citations come back referencing chunkIds that
 * do not exist in the input, we drop them and count them; see
 * EDGE_CASES.md "Citation hallucination".
 *
 * This module is server-only. Lives behind a Convex action.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Item, Chunk, DialogueLine } from "@/lib/types";
import { SCRIPT_SYSTEM_PROMPT, EMIT_LINES_TOOL } from "./prompts/script";

const MODEL = "claude-opus-4-7";
const MAX_TOKENS = 8192;
const MIN_LINES = 12;

export interface GenerateScriptInput {
  items: Item[];
  chunks: Chunk[];        // ALL chunks for ALL items, flat
  episodeId: string;
}

export interface GenerateScriptResult {
  lines: DialogueLine[];
  rawUsage: { input_tokens: number; output_tokens: number };
  invalidCitations: number;
}

/** Shape the model returns through the emit_dialogue_lines tool. */
interface RawLine {
  speaker: "vega" | "theo";
  text: string;
  citation?: { itemId: string; chunkId: string };
}

export async function generateScript(
  input: GenerateScriptInput,
): Promise<GenerateScriptResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // Build the source corpus the model sees. Tag each chunk with its id so the
  // model can cite back to it. (The caller sets each id to the real Convex
  // chunk id, so a citation maps straight to a stored chunk.)
  const corpus = input.items
    .map((item) => {
      const itemChunks = input.chunks.filter((c) => c.itemId === item.id);
      const body = itemChunks
        .map((c) => `<chunk id="${c.id}">\n${c.text}\n</chunk>`)
        .join("\n\n");
      return `<item id="${item.id}" title="${escapeXml(item.title)}">\n${body}\n</item>`;
    })
    .join("\n\n");

  let { rawLines, usage } = await callModel(client, corpus, false);

  // EDGE_CASES "Empty script": one retry with a firmer nudge before giving up.
  if (rawLines.length < MIN_LINES) {
    ({ rawLines, usage } = await callModel(client, corpus, true));
  }
  if (rawLines.length < MIN_LINES) {
    throw new Error(
      "We could not generate a good episode from this Pile. Try a different mix of items.",
    );
  }

  const validChunkIds = new Set(input.chunks.map((c) => c.id));
  const { lines, invalidCitations } = finalizeLines(
    rawLines,
    validChunkIds,
    input.episodeId,
  );

  return {
    lines,
    rawUsage: {
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
    },
    invalidCitations,
  };
}

async function callModel(
  client: Anthropic,
  corpus: string,
  stronger: boolean,
): Promise<{ rawLines: RawLine[]; usage: Anthropic.Messages.Usage }> {
  const system = stronger
    ? `${SCRIPT_SYSTEM_PROMPT}\n\nYour previous attempt was too short. Produce a full conversation of at least 20 lines (700 to 1100 words): cover three items, debate one point, end on a recommendation.`
    : SCRIPT_SYSTEM_PROMPT;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system,
    tools: [EMIT_LINES_TOOL],
    tool_choice: { type: "tool", name: "emit_dialogue_lines" },
    messages: [{ role: "user", content: corpus }],
  });

  const block = response.content.find((b) => b.type === "tool_use");
  const rawLines =
    block && block.type === "tool_use"
      ? ((block.input as { lines?: RawLine[] }).lines ?? [])
      : [];

  return { rawLines, usage: response.usage };
}

/**
 * Turn the model's raw lines into stored DialogueLines, enforcing the citation
 * contract: a citation pointing at a chunkId that is not in the input is
 * dropped (the line becomes filler) and counted. Pure: no I/O, unit-tested.
 */
export function finalizeLines(
  rawLines: RawLine[],
  validChunkIds: Set<string>,
  episodeId: string,
): { lines: DialogueLine[]; invalidCitations: number } {
  let invalidCitations = 0;

  const lines: DialogueLine[] = rawLines.map((ln, i) => {
    const line: DialogueLine = {
      id: `${episodeId}_${i}`,
      episodeId,
      index: i,
      speaker: ln.speaker,
      text: ln.text,
    };
    if (ln.citation) {
      if (validChunkIds.has(ln.citation.chunkId)) {
        line.citation = ln.citation;
      } else {
        invalidCitations += 1; // hallucinated chunkId: drop, line is now filler
      }
    }
    return line;
  });

  return { lines, invalidCitations };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
