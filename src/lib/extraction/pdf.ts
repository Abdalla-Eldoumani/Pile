/**
 * Client-side PDF text extraction via pdfjs-dist.
 *
 * Implements T3.2 in TASKS.md.
 *
 * IMPORTANT: pdfjs-dist runs in the browser. Import this only from a client
 * component (the AddItemDialog handler). The worker ships from
 * /public/pdfjs/pdf.worker.min.mjs, copied from the installed pdfjs-dist build;
 * keep it in sync with the package version (see convex/../src/lib notes).
 *
 * EDGE_CASES.md: scanned PDFs (no text), encrypted PDFs (throw friendly),
 * >200 pages (refuse), multi-column layout (best-effort).
 */

export interface PdfExtraction {
  text: string;
  pages: Array<{ page: number; charStart: number; charEnd: number }>;
}

const MAX_PAGES = 200;
const MIN_TEXT_CHARS = 50;

// Structural types: satisfied by both the browser and legacy pdfjs builds, so
// extractDocText can be exercised in Node without pulling in DOM-only types.
interface PdfTextItem {
  str?: string;
}
interface PdfPageProxy {
  getTextContent(): Promise<{ items: PdfTextItem[] }>;
}
export interface PdfDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PdfPageProxy>;
}

export async function extractPdfText(file: File): Promise<PdfExtraction> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

  const data = new Uint8Array(await file.arrayBuffer());

  let doc: PdfDocumentProxy;
  try {
    doc = (await pdfjs.getDocument({ data }).promise) as unknown as PdfDocumentProxy;
  } catch (err) {
    if (isPasswordException(err)) {
      throw new Error("This PDF is password-protected and cannot be read.");
    }
    throw new Error("This file could not be read as a PDF. Try a different file.");
  }

  return extractDocText(doc);
}

/**
 * The extraction core: iterate pages, join text content, and track each page's
 * char range in the assembled string so chunks can later be mapped to a page.
 * Separated from extractPdfText so it can run against any pdfjs build, browser
 * or Node, for testing.
 */
export async function extractDocText(doc: PdfDocumentProxy): Promise<PdfExtraction> {
  if (doc.numPages > MAX_PAGES) {
    throw new Error("This PDF is too long for a single Pile item. Split it first.");
  }

  const pages: PdfExtraction["pages"] = [];
  let text = "";

  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent();
    const pageText = content.items
      .map((it) => it.str ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (p > 1) text += "\n\n";
    const charStart = text.length;
    text += pageText;
    pages.push({ page: p, charStart, charEnd: text.length });
  }

  if (text.length < MIN_TEXT_CHARS) {
    throw new Error(
      "This PDF appears to be image-only. Upload a text PDF, or paste the text manually.",
    );
  }

  return { text, pages };
}

function isPasswordException(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    "name" in err &&
    (err as { name?: string }).name === "PasswordException"
  );
}
