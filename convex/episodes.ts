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

export const latest = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) return null;
    return await ctx.db
      .query("episodes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .first();
  },
});

/**
 * The cited chunks for an episode, keyed for the source-excerpt panel: the
 * player looks up the current line's citationChunkId here to show the source
 * paragraph. Bounded by the number of distinct cited chunks in one episode.
 */
export const citedChunks = query({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    const lines = await ctx.db
      .query("dialogueLines")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();

    const chunkIds = [
      ...new Set(
        lines
          .map((l) => l.citationChunkId)
          .filter((id): id is NonNullable<typeof id> => id != null),
      ),
    ];

    const itemTitle = new Map<string, string>();
    const out: Array<{
      chunkId: string;
      text: string;
      itemTitle: string;
      pageStart?: number;
    }> = [];

    for (const chunkId of chunkIds) {
      const chunk = await ctx.db.get(chunkId);
      if (!chunk) continue;
      if (!itemTitle.has(chunk.itemId)) {
        const item = await ctx.db.get(chunk.itemId);
        itemTitle.set(chunk.itemId, item?.title ?? "Source");
      }
      out.push({
        chunkId,
        text: chunk.text,
        itemTitle: itemTitle.get(chunk.itemId) ?? "Source",
        ...(chunk.pageStart !== undefined ? { pageStart: chunk.pageStart } : {}),
      });
    }
    return out;
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

// --- Audio render (Phase 5) ---

export const linesForEpisodeInternal = internalQuery({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }): Promise<Doc<"dialogueLines">[]> => {
    // by_episode is [episodeId, index], so this returns lines in order.
    return await ctx.db
      .query("dialogueLines")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();
  },
});

export const setRendering = internalMutation({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }): Promise<void> => {
    await ctx.db.patch(episodeId, { status: "rendering" });
  },
});

export const saveAudio = internalMutation({
  args: {
    episodeId: v.id("episodes"),
    audioFileId: v.id("_storage"),
    durationMs: v.number(),
    waveform: v.array(v.number()),
    marks: v.array(
      v.object({
        lineId: v.id("dialogueLines"),
        startMs: v.number(),
        endMs: v.number(),
      }),
    ),
  },
  handler: async (
    ctx,
    { episodeId, audioFileId, durationMs, waveform, marks },
  ): Promise<void> => {
    // Clear any marks from a previous render so a retry doesn't duplicate them.
    const existing = await ctx.db
      .query("timingMarks")
      .withIndex("by_episode", (q) => q.eq("episodeId", episodeId))
      .collect();
    for (const e of existing) await ctx.db.delete(e._id);

    for (const m of marks) {
      await ctx.db.insert("timingMarks", {
        episodeId,
        lineId: m.lineId,
        startMs: m.startMs,
        endMs: m.endMs,
      });
    }
    await ctx.db.patch(episodeId, {
      status: "ready",
      audioFileId,
      durationMs,
      waveform,
    });
  },
});

/** The playable audio URL for the player. Null until the episode is ready. */
export const audioUrl = query({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const ep = await ctx.db.get(episodeId);
    if (!ep || !ep.audioFileId) return null;
    return await ctx.storage.getUrl(ep.audioFileId);
  },
});
