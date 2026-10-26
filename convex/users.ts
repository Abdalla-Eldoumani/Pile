import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * The `me` query is the canonical health check for the Clerk + Convex
 * bridge. Calling `useQuery(api.users.me)` from a signed-in
 * client must return a user document.
 *
 * The first time a signed-in user calls anything, ensureUser ensures we
 * have a mirror row in the `users` table.
 */

export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    return user;
  },
});

export const ensureUser = mutation({
  args: {
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, { timezone }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (existing) {
      if (timezone && existing.timezone !== timezone) {
        await ctx.db.patch(existing._id, { timezone });
      }
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkUserId: identity.subject,
      email: identity.email ?? "",
      name: identity.name ?? undefined,
      timezone,
    });
  },
});
