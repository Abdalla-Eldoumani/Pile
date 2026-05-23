import { v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { fetchUrlAsMarkdown, stripTrackingParams } from "../src/lib/extraction/url";
import { fetchYouTubeTranscript } from "../src/lib/extraction/youtube";
import { chunkText } from "../src/lib/extraction/chunk";

/**
 * Items = the user's Pile.
 *
 * addItem is an ACTION (can call external services: Jina, YouTube). It extracts
 * and chunks the content, then hands the result to the `create` internal
 * mutation, which writes Item + Chunks transactionally and dedupes on the
 * canonical URL. PDF text is extracted client-side (see src/lib/extraction/pdf)
 * and passed in as `text`, because pdfjs runs in the browser.
 */

const MIN_CONTENT_CHARS = 50;

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
    // Pre-extracted text: client-side PDF extraction, or a manual paste
    // fallback for paywalled URLs / caption-less videos.
    text: v.optional(v.string()),
    pages: v.optional(
      v.array(
        v.object({
          page: v.number(),
          charStart: v.number(),
          charEnd: v.number(),
        }),
      ),
    ),
    title: v.optional(v.string()),
    pdfStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args): Promise<Id<"items">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");

    let content: string;
    let title: string;
    let canonicalUrl: string | undefined;

    if (args.text && args.text.trim().length > 0) {
      // Caller supplied the text directly (PDF, or manual paste).
      content = args.text;
      title = args.title ?? defaultTitle(args.kind);
      canonicalUrl = args.url ? stripTrackingParams(args.url) : undefined;
    } else if (args.kind === "url") {
      if (!args.url) throw new Error("A URL is required.");
      const extracted = await fetchUrlAsMarkdown(args.url);
      content = extracted.markdown;
      title = args.title ?? extracted.title;
      canonicalUrl = extracted.url;
    } else if (args.kind === "youtube") {
      if (!args.url) throw new Error("A YouTube URL is required.");
      const yt = await fetchYouTubeTranscript(args.url);
      if (!yt) {
        throw new Error(
          "This video has no transcript available. Paste the transcript to add it.",
        );
      }
      content = yt.transcript;
      title = args.title ?? yt.title ?? "YouTube video";
      canonicalUrl = stripTrackingParams(args.url);
    } else {
      // pdf with no text: client extraction failed or produced nothing.
      throw new Error(
        "This PDF could not be read. Upload a text PDF, or paste the text manually.",
      );
    }

    content = content.trim();
    if (content.length < MIN_CONTENT_CHARS) {
      throw new Error("There was not enough text to add this item.");
    }

    const rawChunks = chunkText(content, { itemId: "pending" });
    const chunks = rawChunks.map((c, i) => {
      const base = {
        index: i,
        charStart: c.charStart,
        charEnd: c.charEnd,
        text: c.text,
      };
      if (!args.pages) return base;
      const pageStart = pageForOffset(args.pages, c.charStart);
      const pageEnd = pageForOffset(args.pages, Math.max(c.charStart, c.charEnd - 1));
      return {
        ...base,
        ...(pageStart !== undefined ? { pageStart } : {}),
        ...(pageEnd !== undefined ? { pageEnd } : {}),
      };
    });

    return await ctx.runMutation(internal.items.create, {
      kind: args.kind,
      title,
      chunks,
      ...(canonicalUrl !== undefined ? { canonicalUrl } : {}),
      ...(args.pdfStorageId !== undefined ? { sourceFileId: args.pdfStorageId } : {}),
    });
  },
});

export const create = internalMutation({
  args: {
    kind: v.union(v.literal("url"), v.literal("pdf"), v.literal("youtube")),
    title: v.string(),
    canonicalUrl: v.optional(v.string()),
    sourceFileId: v.optional(v.id("_storage")),
    chunks: v.array(
      v.object({
        index: v.number(),
        charStart: v.number(),
        charEnd: v.number(),
        text: v.string(),
        pageStart: v.optional(v.number()),
        pageEnd: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args): Promise<Id<"items">> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated.");
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkUserId", identity.subject))
      .unique();
    if (!user) throw new Error("User row missing; sign in again.");

    // Dedupe within this user's Pile: a repeated URL jumps to the existing item.
    if (args.canonicalUrl) {
      const existing = await ctx.db
        .query("items")
        .withIndex("by_user_and_url", (q) =>
          q.eq("userId", user._id).eq("canonicalUrl", args.canonicalUrl),
        )
        .first();
      if (existing) return existing._id;
    }

    const itemId = await ctx.db.insert("items", {
      userId: user._id,
      kind: args.kind,
      title: args.title,
      addedAt: Date.now(),
      ...(args.canonicalUrl !== undefined ? { canonicalUrl: args.canonicalUrl } : {}),
      ...(args.sourceFileId !== undefined ? { sourceFileId: args.sourceFileId } : {}),
    });

    for (const c of args.chunks) {
      await ctx.db.insert("chunks", {
        itemId,
        userId: user._id,
        index: c.index,
        charStart: c.charStart,
        charEnd: c.charEnd,
        text: c.text,
        ...(c.pageStart !== undefined ? { pageStart: c.pageStart } : {}),
        ...(c.pageEnd !== undefined ? { pageEnd: c.pageEnd } : {}),
      });
    }

    return itemId;
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

/** Map a char offset in the assembled text back to its PDF page number. */
function pageForOffset(
  pages: Array<{ page: number; charStart: number; charEnd: number }>,
  offset: number,
): number | undefined {
  for (const p of pages) {
    if (offset >= p.charStart && offset < p.charEnd) return p.page;
  }
  return pages.length ? pages[pages.length - 1].page : undefined;
}

function defaultTitle(kind: "url" | "pdf" | "youtube"): string {
  if (kind === "pdf") return "PDF document";
  if (kind === "youtube") return "YouTube video";
  return "Saved article";
}
