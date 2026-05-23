import { v } from "convex/values";
import { action, query } from "./_generated/server";

/**
 * Episodes: the generation pipeline.
 *
 * Implements T4.3 (script) + T5.5 (audio) in TASKS.md.
 *
 * generateEpisode runs as an ACTION. It is allowed to be slow (30 to 90s).
 * The UI subscribes via useQuery(byId) and watches the status field.
 */

export const byId = query({
  args: { episodeId: v.id("episodes") },
  handler: async (ctx, { episodeId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const ep = await ctx.db.get(episodeId);
    if (!ep) return null;
    // Verify ownership.
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

export const generateEpisode = action({
  args: {
    itemIds: v.array(v.id("items")),
  },
  handler: async (_ctx, _args) => {
    // TODO(T4.3 + T5.5):
    //
    // 1. ensureUser, validate the items belong to that user
    // 2. create an episodes row with status='generating'
    // 3. load all chunks for those items
    // 4. call generateScript() from src/lib/ai/script.ts
    // 5. write dialogueLines (status -> 'scripted')
    // 6. for each line, call synthesizeLine() (mark 'rendering')
    // 7. stitchAudio, computeWaveform, write the audio blob + timingMarks
    // 8. flip status -> 'ready'
    // 9. on any failure, set status='failed' with errorMessage; do not throw
    throw new Error("generateEpisode not implemented; see T4.3 + T5.5 in TASKS.md");
  },
});
