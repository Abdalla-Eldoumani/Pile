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

const PAYWALL_SIGNALS = [
  "subscribe to continue",
  "subscribe to read",
  "create a free account",
  "this content is for subscribers",
  "already a subscriber",
];

export interface UrlExtraction {
  title: string;
  url: string;          // canonical, tracking-stripped
  markdown: string;
}

export async function fetchUrlAsMarkdown(url: string): Promise<UrlExtraction> {
  const cleanedUrl = stripTrackingParams(url);

  const headers: Record<string, string> = { Accept: "text/markdown" };
  // Optional: a key raises the rate limit. Jina Reader works without one.
  if (process.env.JINA_API_KEY) {
    headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`;
  }

  let res: Response;
  try {
    res = await fetch(`${JINA_BASE}${cleanedUrl}`, { headers });
  } catch {
    throw new Error("Could not reach this URL. Check the link.");
  }
  if (!res.ok) {
    throw new Error("Could not reach this URL. Check the link.");
  }

  const { title: preambleTitle, content } = splitJinaResponse(await res.text());

  const lower = content.toLowerCase();
  if (content.length < 500 || PAYWALL_SIGNALS.some((s) => lower.includes(s))) {
    throw new Error(
      "This article appears to be paywalled or empty. Paste the text manually, or try a different URL.",
    );
  }

  const title =
    preambleTitle ??
    firstMarkdownHeading(content) ??
    new URL(cleanedUrl).hostname.replace(/^www\./, "");

  return { title, url: cleanedUrl, markdown: content };
}

/**
 * Jina Reader prepends a metadata block ("Title:", "URL Source:",
 * "Published Time:") and then "Markdown Content:" before the article. Pull
 * the title out and return only the content below the marker.
 */
function splitJinaResponse(raw: string): { title?: string; content: string } {
  const titleMatch = raw.match(/^Title:\s*(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : undefined;

  const marker = "Markdown Content:";
  const idx = raw.indexOf(marker);
  const content = (idx >= 0 ? raw.slice(idx + marker.length) : raw).trim();

  return { title, content };
}

function firstMarkdownHeading(md: string): string | undefined {
  const m = md.match(/^#{1,3}\s+(.+)$/m);
  return m ? m[1].replace(/[#*_`[\]]/g, "").trim() : undefined;
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
