import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

/**
 * Reminders: the demo-magic feature.
 *
 * Implements T7.4 + T7.5 in TASKS.md.
 *
 * createReminder writes the row AND schedules its firing via
 * scheduler.runAt. The scheduled function flips status and (stretch)
 * sends a notification. The reminder is durable: if the server restarts,
 * Convex still fires it.
 */

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) return [];
    return await ctx.db
      .query("reminders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .collect();
  },
});

export const byId = query({
  args: { reminderId: v.id("reminders") },
  handler: async (ctx, { reminderId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const reminder = await ctx.db.get(reminderId);
    if (!reminder) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user || user._id !== reminder.userId) return null;
    return reminder;
  },
});

export const createReminder = mutation({
  args: {
    scheduledFor: v.number(),
    label: v.string(),
    episodeId: v.id("episodes"),
    audioAnchorMs: v.number(),
    lineId: v.optional(v.id("dialogueLines")),
    chunkId: v.optional(v.id("chunks")),
    chunkExcerpt: v.optional(v.string()),
    itemTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) throw new Error("User row missing; call ensureUser first.");

    if (args.scheduledFor < Date.now()) {
      throw new Error(
        "That time is in the past. Try a future time.",
      );
    }

    const id = await ctx.db.insert("reminders", {
      userId: user._id,
      scheduledFor: args.scheduledFor,
      label: args.label,
      episodeId: args.episodeId,
      audioAnchorMs: args.audioAnchorMs,
      lineId: args.lineId,
      chunkId: args.chunkId,
      chunkExcerpt: args.chunkExcerpt,
      itemTitle: args.itemTitle,
      status: "pending",
      createdAt: Date.now(),
    });

    // Schedule the fire mutation at the user's chosen time.
    await ctx.scheduler.runAt(
      args.scheduledFor,
      internal.reminders.fire,
      { reminderId: id },
    );

    return id;
  },
});

export const dismiss = mutation({
  args: { reminderId: v.id("reminders") },
  handler: async (ctx, { reminderId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");
    const reminder = await ctx.db.get(reminderId);
    if (!reminder) return;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user || user._id !== reminder.userId) {
      throw new Error("Not authorized.");
    }
    await ctx.db.patch(reminderId, { status: "dismissed" });
  },
});

export const fire = internalMutation({
  args: { reminderId: v.id("reminders") },
  handler: async (ctx, { reminderId }) => {
    const r = await ctx.db.get(reminderId);
    if (!r || r.status !== "pending") return;
    await ctx.db.patch(reminderId, { status: "fired" });
    // TODO(T7.5 stretch): send a Web Push notification here.
  },
});
