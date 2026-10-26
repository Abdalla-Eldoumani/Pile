import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Pile: Convex schema.
 *
 * Source of truth. Keep src/lib/types.ts aligned with this file.
 * The data flow is summarized in README.md (How it works).
 */

export default defineSchema({
  // Mirrored from Clerk on first sign-in.
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    timezone: v.optional(v.string()),
  }).index("by_clerk_id", ["clerkUserId"]),

  // One per piece of content in the user's Pile.
  items: defineTable({
    userId: v.id("users"),
    kind: v.union(v.literal("url"), v.literal("pdf"), v.literal("youtube")),
    title: v.string(),
    canonicalUrl: v.optional(v.string()),
    sourceFileId: v.optional(v.id("_storage")),  // PDF blob if uploaded
    addedAt: v.number(),
  })
    .index("by_user", ["userId", "addedAt"])
    .index("by_user_and_url", ["userId", "canonicalUrl"]),

  // One per chunked section of an item's text.
  chunks: defineTable({
    itemId: v.id("items"),
    userId: v.id("users"),
    index: v.number(),
    charStart: v.number(),
    charEnd: v.number(),
    pageStart: v.optional(v.number()),
    pageEnd: v.optional(v.number()),
    text: v.string(),
  })
    .index("by_item", ["itemId", "index"]),

  // One per generated podcast episode.
  episodes: defineTable({
    userId: v.id("users"),
    status: v.union(
      v.literal("queued"),
      v.literal("generating"),
      v.literal("scripted"),
      v.literal("rendering"),
      v.literal("ready"),
      v.literal("failed"),
    ),
    title: v.optional(v.string()),
    audioFileId: v.optional(v.id("_storage")),
    durationMs: v.optional(v.number()),
    waveform: v.optional(v.array(v.number())),  // 600 RMS amplitudes in [0, 1]
    itemIds: v.array(v.id("items")),             // which items this episode discussed
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "createdAt"]),

  // Ordered script lines for an episode.
  dialogueLines: defineTable({
    episodeId: v.id("episodes"),
    userId: v.id("users"),
    index: v.number(),
    speaker: v.union(v.literal("vega"), v.literal("theo")),
    text: v.string(),
    citationItemId: v.optional(v.id("items")),
    citationChunkId: v.optional(v.id("chunks")),
  })
    .index("by_episode", ["episodeId", "index"]),

  // One per dialogue line, with start/end in the stitched audio.
  timingMarks: defineTable({
    episodeId: v.id("episodes"),
    lineId: v.id("dialogueLines"),
    startMs: v.number(),
    endMs: v.number(),
  })
    .index("by_episode", ["episodeId", "startMs"]),

  // User-set return points. The whole reason this app exists.
  reminders: defineTable({
    userId: v.id("users"),
    scheduledFor: v.number(),                    // UTC ms
    label: v.string(),
    episodeId: v.id("episodes"),
    audioAnchorMs: v.number(),
    lineId: v.optional(v.id("dialogueLines")),
    chunkId: v.optional(v.id("chunks")),
    chunkExcerpt: v.optional(v.string()),         // denormalized for fast render
    itemTitle: v.optional(v.string()),            // denormalized for fast render
    status: v.union(
      v.literal("pending"),
      v.literal("fired"),
      v.literal("dismissed"),
    ),
    scheduledFunctionId: v.optional(v.string()), // id returned by scheduler.runAt
    createdAt: v.number(),
  })
    .index("by_user", ["userId", "createdAt"])
    .index("by_user_and_status", ["userId", "status", "scheduledFor"]),
});
