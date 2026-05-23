import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Items = the user's Pile.
 *
 * Implements T3.5 in TASKS.md.
 *
 * addItem is an ACTION (runs in Node, can call external services).
 * It detects the kind from the URL pattern (or file presence), runs the
 * matching extractor, chunks the text, and writes Item + Chunks via
 * internal mutations.
 */

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.runQuery(api.users.me);
    if (!user) return [];
    return await ctx.db
      .query("items")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const addItem = action({
  args: {
    kind: v.union(v.literal("url"), v.literal("pdf"), v.literal("youtube")),
    url: v.optional(v.string()),
    pdfStorageId: v.optional(v.id("_storage")),
    title: v.optional(v.string()),
  },
  handler: async (_ctx, _args) => {
    // TODO(T3.5):
    // 1. ensureUser via api.users.ensureUser
    // 2. route by kind:
    //    - url    -> fetchUrlAsMarkdown
    //    - pdf    -> read storage blob, server-side pdf extract (or pre-extracted on client)
    //    - youtube -> fetchYouTubeTranscript
    // 3. chunkText
    // 4. dedupe by canonicalUrl on the userId index
    // 5. write Item + Chunks atomically via an internal mutation
    // 6. return the new item id
    throw new Error("addItem not implemented; see T3.5 in TASKS.md");
  },
});

export const remove = mutation({
  args: { itemId: v.id("items") },
  handler: async (ctx, { itemId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");

    const item = await ctx.db.get(itemId);
    if (!item) return;

    // Verify ownership before deleting.
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user || user._id !== item.userId) {
      throw new Error("Not authorized.");
    }

    // Cascade: chunks first, then item.
    const chunks = await ctx.db
      .query("chunks")
      .withIndex("by_item", (q) => q.eq("itemId", itemId))
      .collect();
    for (const c of chunks) await ctx.db.delete(c._id);
    await ctx.db.delete(itemId);
  },
});
