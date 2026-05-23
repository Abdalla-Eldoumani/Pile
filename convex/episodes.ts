import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

/**
 * Episodes: queries and the data-write half of the generation pipeline.
 *
 * The generateEpisode ACTION lives in convex/generate.ts ("use node"): the
 * Anthropic SDK needs the Node runtime, which cannot share a file with queries
 * or mutations. That action calls the internal functions below to create the
 * row, load source, and save the script. Audio (T5.5) is Phase 5.
 */

export const byId = query({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const ep = await ctx.db.get(episodeId);
    if (!ep) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user || user._id !== ep.userId) return null;
    return ep;
  },
});

export const linesForEpisode = query({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    return await ctx.db
      .query("dialogueLines")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();
  },
});

export const timingForEpisode = query({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    return await ctx.db
      .query("timingMarks")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();
  },
});

export const createPending = internalMutation({
  args: { itemIds: v.array(v.id("items")) },
  handler: async (ctx, { itemIds }): Promise<Id<"episodes">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) throw new Error("User row missing; sign in again.");
    return await ctx.db.insert("episodes", {
      userId: user._id,
      status: "generating",
      itemIds,
      createdAt: Date.now(),
    });
  },
});

export const loadItemsAndChunks = internalQuery({
  args: { itemIds: v.array(v.id("items")) },
  handler: async (
    ctx,
    { itemIds },
  ): Promise<{ items: Doc<"items">[]; chunks: Doc<"chunks">[] }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) throw new Error("User row missing; sign in again.");

    const items: Doc<"items">[] = [];
    const chunks: Doc<"chunks">[] = [];
    for (const id of itemIds) {
      const item = await ctx.db.get(id);
      if (!item || item.userId !== user._id) continue; // ownership filter
      items.push(item);
      const itemChunks = await ctx.db
        .query("chunks")
        .withIndex("by_item", (q) => q.eq("itemId", id))
        .collect();
      chunks.push(...itemChunks);
    }
    return { items, chunks };
  },
});

export const saveScript = internalMutation({
  args: {
    episodeId: v.id("episodes"),
    title: v.string(),
    lines: v.array(
      v.object({
        index: v.number(),
        speaker: v.union(v.literal("vega"), v.literal("theo")),
        text: v.string(),
        citationItemId: v.optional(v.id("items")),
        citationChunkId: v.optional(v.id("chunks")),
      }),
    ),
  },
  handler: async (ctx, { episodeId, title, lines }): Promise<void> => {
    const ep = await ctx.db.get(episodeId);
    if (!ep) return;
    for (const ln of lines) {
      await ctx.db.insert("dialogueLines", {
        episodeId,
        userId: ep.userId,
        index: ln.index,
        speaker: ln.speaker,
        text: ln.text,
        ...(ln.citationItemId !== undefined
          ? { citationItemId: ln.citationItemId }
          : {}),
        ...(ln.citationChunkId !== undefined
          ? { citationChunkId: ln.citationChunkId }
          : {}),
      });
    }
    await ctx.db.patch(episodeId, { status: "scripted", title });
  },
});

export const markFailed = internalMutation({
  args: { episodeId: v.id("episodes"), message: v.string() },
  handler: async (ctx, { episodeId, message }): Promise<void> => {
    await ctx.db.patch(episodeId, { status: "failed", errorMessage: message });
  },
});
