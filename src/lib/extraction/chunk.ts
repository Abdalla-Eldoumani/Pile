/**
 * Chunk a long string into ~600 token chunks with ~50 token overlap.
 *
 * Pure function. No deps.
 *
 * "Token" here is approximated as 4 chars; close enough for sizing the
 * prompts that downstream code sends to Claude. The actual token count
 * is computed by Anthropic server-side.
 */

import type { Chunk } from "@/lib/types";

const CHARS_PER_TOKEN_APPROX = 4;

export interface ChunkOptions {
  itemId: string;
  targetTokens?: number;   // default 600
  overlapTokens?: number;  // default 50
}

export function chunkText(text: string, opts: ChunkOptions): Chunk[] {
  const targetChars = (opts.targetTokens ?? 600) * CHARS_PER_TOKEN_APPROX;
  const overlapChars = (opts.overlapTokens ?? 50) * CHARS_PER_TOKEN_APPROX;

  const chunks: Chunk[] = [];
  let i = 0;
  let n = 0;

  while (i < text.length) {
    // Try to break at a sentence end within the last ~15% of the window
    // for more natural chunks. Not strict.
    let end = Math.min(i + targetChars, text.length);
    if (end < text.length) {
      const breakWindow = text.slice(i + Math.floor(targetChars * 0.85), end);
      const lastDot = Math.max(
        breakWindow.lastIndexOf(". "),
        breakWindow.lastIndexOf(".\n"),
        breakWindow.lastIndexOf("? "),
        breakWindow.lastIndexOf("! "),
      );
      if (lastDot > 0) {
        end = i + Math.floor(targetChars * 0.85) + lastDot + 1;
      }
    }

    const piece = text.slice(i, end).trim();
    if (piece.length > 0) {
      chunks.push({
        id: `${opts.itemId}_${n.toString().padStart(4, "0")}`,
        itemId: opts.itemId,
        charStart: i,
        charEnd: end,
        text: piece,
      });
      n += 1;
    }

    if (end >= text.length) break;
    // Advance relative to where this chunk actually ended (which the sentence
    // break may have shortened), so the overlap holds and no text is skipped.
    i = Math.max(i + 1, end - overlapChars);
  }

  return chunks;
}
