/**
 * Script generation. The temporal anchoring foundation.
 *
 * Implements T4.1 in TASKS.md.
 *
 * Critical contract: every non-filler DialogueLine MUST carry a
 * { itemId, chunkId } citation. We enforce this with the Anthropic
 * tool use API: the model returns lines via a structured tool, not
 * via free text. If citations come back referencing chunkIds that
 * do not exist in the input, we drop them and log; see EDGE_CASES.md
 * "Citation hallucination".
 *
 * This module is server-only. Lives behind a Convex action.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { Item, Chunk, DialogueLine } from "@/lib/types";
import { SCRIPT_SYSTEM_PROMPT, EMIT_LINES_TOOL } from "@/lib/ai/prompts/script";

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

export async function generateScript(
  input: GenerateScriptInput,
): Promise<GenerateScriptResult> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Build the source corpus the model sees. Tag each chunk with its id so
  // the model can cite back.
  const corpus = input.items
    .map((item) => {
      const itemChunks = input.chunks.filter((c) => c.itemId === item.id);
      const body = itemChunks
        .map((c) => `<chunk id="${c.id}">\n${c.text}\n</chunk>`)
        .join("\n\n");
      return `<item id="${item.id}" title="${escapeXml(item.title)}">\n${body}\n</item>`;
    })
    .join("\n\n");

  // TODO(T4.1): the actual call. Sketch:
  //
  // const response = await client.messages.create({
  //   model: "claude-opus-4-7",
  //   max_tokens: 4096,
  //   system: SCRIPT_SYSTEM_PROMPT,
  //   tools: [EMIT_LINES_TOOL],
  //   tool_choice: { type: "tool", name: "emit_dialogue_lines" },
  //   messages: [{ role: "user", content: corpus }],
  // });
  //
  // const toolUse = response.content.find(b => b.type === "tool_use");
  // const lines = toolUse.input.lines;  // matches EMIT_LINES_TOOL schema
  //
  // // Validate every citation chunkId actually exists. Drop invalid ones.
  // const validChunkIds = new Set(input.chunks.map(c => c.id));
  // let invalidCitations = 0;
  // const cleaned: DialogueLine[] = lines.map((ln, i) => {
  //   const cite = ln.citation;
  //   if (cite && !validChunkIds.has(cite.chunkId)) {
  //     invalidCitations += 1;
  //     return { ...ln, id: `${input.episodeId}_${i}`, index: i, citation: undefined };
  //   }
  //   return { ...ln, id: `${input.episodeId}_${i}`, index: i, episodeId: input.episodeId };
  // });
  //
  // return { lines: cleaned, rawUsage: response.usage, invalidCitations };

  void client;
  void corpus;
  void SCRIPT_SYSTEM_PROMPT;
  void EMIT_LINES_TOOL;
  throw new Error("generateScript not implemented; see T4.1 in TASKS.md");
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
