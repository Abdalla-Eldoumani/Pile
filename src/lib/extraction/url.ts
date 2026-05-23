/**
 * Fetch a URL and return clean Markdown via Jina Reader.
 *
 * Jina Reader is a free service: prefix any URL with https://r.jina.ai/
 * and it returns LLM-friendly Markdown. No auth required for reasonable
 * traffic; with a JINA_API_KEY you get higher rate limits.
 *
 * Implements T3.1 in TASKS.md.
 * EDGE_CASES.md: paywalled articles, JS-rendered SPAs, dead URLs, tracking params.
 */

const JINA_BASE = "https://r.jina.ai/";

export interface UrlExtraction {
  title: string;
  url: string;          // canonical, tracking-stripped
  markdown: string;
}

export async function fetchUrlAsMarkdown(url: string): Promise<UrlExtraction> {
  // TODO(T3.1):
  // 1. strip tracking params (utm_*, fbclid, gclid, ref, mc_eid)
  // 2. call `${JINA_BASE}${cleanedUrl}` with `Accept: text/markdown` and (if present) `Authorization: Bearer ${process.env.JINA_API_KEY}`
  // 3. detect paywall: response < 500 chars OR contains paywall keywords -> throw with user-friendly message
  // 4. parse title from the first markdown H1 if present, else from the URL host
  // 5. return { title, url: cleanedUrl, markdown }
  void JINA_BASE;
  throw new Error("fetchUrlAsMarkdown not implemented; see T3.1 in TASKS.md");
}

export function stripTrackingParams(rawUrl: string): string {
  // Helper used both for canonicalization (for de-dup) and for the call above.
  const url = new URL(rawUrl);
  const ban = ["fbclid", "gclid", "mc_eid", "ref"];
  for (const key of Array.from(url.searchParams.keys())) {
    if (key.startsWith("utm_") || ban.includes(key)) {
      url.searchParams.delete(key);
    }
  }
  return url.toString();
}
