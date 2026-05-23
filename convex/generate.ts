"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { generateScript } from "../src/lib/ai/script";

/**
 * The episode generation action. Lives in its own "use node" file because the
 * Anthropic SDK pulls in Node built-ins (node:stream/promises) and cannot run
 * in Convex's default V8 runtime. It orchestrates the V8 functions in
 * episodes.ts: create the row, load source, generate the script, save the
 * lines. Any failure flips the episode to 'failed' instead of throwing, so the
 * subscribed UI always has a status to render.
 *
 * Implements T4.3. Audio (scripted -> ready, T5.5) is Phase 5.
 */

// Bound context/cost on a large Pile.
const MAX_ITEMS = 5;
const MAX_CHUNKS = 100;

export const generateEpisode = action({
  args: { itemIds: v.array(v.id("items")) },
  handler: async (ctx, { itemIds }): Promise<Id<"episodes">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");
    if (itemIds.length < 2) {
      throw new Error("Add at least two items to generate an episode.");
    }

    // Create the row first: the UI subscribes and animates through statuses.
    const episodeId: Id<"episodes"> = await ctx.runMutation(
      internal.episodes.createPending,
      { itemIds },
    );

    try {
      const { items, chunks } = await ctx.runQuery(
        internal.episodes.loadItemsAndChunks,
        { itemIds },
      );
      if (items.length < 2 || chunks.length === 0) {
        throw new Error("These items do not have readable content yet.");
      }

      const cappedItems = items.slice(0, MAX_ITEMS);
      const keptItemIds = new Set(cappedItems.map((i) => i._id));
      const cappedChunks = chunks
        .filter((c) => keptItemIds.has(c.itemId))
        .slice(0, MAX_CHUNKS);

      // Map Convex docs to the lib shape: the `id` field carries the real
      // Convex _id, so a model citation resolves straight back to a chunk.
      const libItems = cappedItems.map((i) => ({
        id: i._id as string,
        userId: i.userId as string,
        kind: i.kind,
        title: i.title,
        addedAt: i.addedAt,
      }));
      const libChunks = cappedChunks.map((c) => ({
        id: c._id as string,
        itemId: c.itemId as string,
        charStart: c.charStart,
        charEnd: c.charEnd,
        text: c.text,
      }));

      const result = await generateScript({
        items: libItems,
        chunks: libChunks,
        episodeId,
      });

      // Resolve each citation's owning item from the chunk itself (not the
      // model's itemId), so both stored ids are valid and consistent.
      const chunkToItem = new Map<string, Id<"items">>(
        cappedChunks.map((c) => [c._id as string, c.itemId]),
      );
      const lines = result.lines.map((ln) => {
        const citationChunkId =
          ln.citation && chunkToItem.has(ln.citation.chunkId)
            ? (ln.citation.chunkId as Id<"chunks">)
            : undefined;
        const citationItemId = citationChunkId
          ? chunkToItem.get(citationChunkId)
          : undefined;
        return {
          index: ln.index,
          speaker: ln.speaker,
          text: ln.text,
          ...(citationChunkId ? { citationChunkId } : {}),
          ...(citationItemId ? { citationItemId } : {}),
        };
      });

      await ctx.runMutation(internal.episodes.saveScript, {
        episodeId,
        title: cappedItems[0].title,
        lines,
      });
      return episodeId;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Episode generation failed.";
      console.error("generateEpisode failed:", message);
      await ctx.runMutation(internal.episodes.markFailed, {
        episodeId,
        message,
      });
      return episodeId;
    }
  },
});
