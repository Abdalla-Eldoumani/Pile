/**
 * Fetch a YouTube transcript via the youtube-transcript npm package.
 *
 * Implements T3.3 in TASKS.md. Runs server-side (Convex action).
 *
 * Design: this never throws. Transcript availability is unreliable (disabled
 * captions, region locks, rate limits, YouTube markup changes), so any failure
 * resolves to null and the UI falls back to a manual transcript paste. A YouTube
 * item must never crash the add-to-Pile flow.
 *
 * EDGE_CASES.md: no transcript available, member-only / region-locked, shorts.
 */

export interface YouTubeExtraction {
  title?: string;
  videoId: string;
  transcript: string;
}

/**
 * Pull the 11-character video id out of any common YouTube URL form:
 * watch?v=, youtu.be/, shorts/, embed/, /v/, and m./music. subdomains.
 * Returns null for anything that is not a recognizable YouTube video URL.
 */
export function parseYouTubeId(url: string): string | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }

  const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");

  if (host === "youtu.be") {
    return normalizeId(u.pathname.split("/")[1]);
  }

  if (host === "youtube.com" || host === "music.youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") return normalizeId(u.searchParams.get("v"));
    const m = u.pathname.match(/^\/(?:shorts|embed|v|live)\/([^/?#]+)/);
    if (m) return normalizeId(m[1]);
  }

  return null;
}

function normalizeId(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Video ids are 11 chars of [A-Za-z0-9_-]. Reject anything else.
  return /^[A-Za-z0-9_-]{11}$/.test(raw) ? raw : null;
}

export async function fetchYouTubeTranscript(
  url: string,
): Promise<YouTubeExtraction | null> {
  const videoId = parseYouTubeId(url);
  if (!videoId) return null;

  let transcript: string;
  try {
    const { YoutubeTranscript } = await import("youtube-transcript");
    const items = await YoutubeTranscript.fetchTranscript(videoId);
    transcript = items
      .map((it) => it.text)
      .join(" ")
      // transcript cues arrive with HTML entities and stray whitespace
      .replace(/&amp;#39;/g, "'")
      .replace(/&amp;quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    // Disabled captions, region lock, rate limit, network, markup drift: all
    // resolve to "no transcript" so the caller offers manual paste.
    return null;
  }

  // Too short to be worth an episode (also covers many shorts).
  if (transcript.length < 50) return null;

  const title = await fetchYouTubeTitle(videoId);
  return { title, videoId, transcript };
}

/** Best-effort title via the public oEmbed endpoint. Never throws. */
async function fetchYouTubeTitle(videoId: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    );
    if (!res.ok) return undefined;
    const data = (await res.json()) as { title?: string };
    return typeof data.title === "string" ? data.title : undefined;
  } catch {
    return undefined;
  }
}
