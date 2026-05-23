/**
 * Fetch a YouTube transcript via the youtube-transcript npm package.
 *
 * Implements T3.3 in TASKS.md.
 *
 * EDGE_CASES.md: no transcript available, member-only / region-locked,
 * shorts (< 60s rejected).
 */

export interface YouTubeExtraction {
  title?: string;
  videoId: string;
  transcript: string;
}

export async function fetchYouTubeTranscript(
  url: string,
): Promise<YouTubeExtraction | null> {
  // TODO(T3.3):
  // 1. Parse videoId from the URL (handle youtube.com/watch?v=, youtu.be/, shorts/)
  // 2. const { YoutubeTranscript } = await import("youtube-transcript");
  // 3. const items = await YoutubeTranscript.fetchTranscript(videoId);
  //    -> on failure, return null so the UI can prompt manual paste
  // 4. transcript = items.map(it => it.text).join(" ").replace(/\s+/g, " ").trim()
  // 5. (stretch) fetch the video title via oEmbed: https://www.youtube.com/oembed?url=...&format=json
  void url;
  throw new Error("fetchYouTubeTranscript not implemented; see T3.3 in TASKS.md");
}
