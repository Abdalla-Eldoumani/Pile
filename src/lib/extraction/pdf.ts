/**
 * Client-side PDF text extraction via pdfjs-dist.
 *
 * Implements T3.2 in TASKS.md.
 *
 * IMPORTANT: pdfjs-dist runs in the browser. This module is "use client" by
 * convention; the caller (an AddItemDialog handler) must be a client
 * component. The worker file ships from /node_modules/pdfjs-dist/build/.
 *
 * EDGE_CASES.md: scanned PDFs (no text), encrypted PDFs (throws), >200 pages
 * (refuse), multi-column layout (best-effort).
 */

export interface PdfExtraction {
  text: string;
  pages: Array<{ page: number; charStart: number; charEnd: number }>;
}

export async function extractPdfText(file: File): Promise<PdfExtraction> {
  // TODO(T3.2):
  // 1. dynamic import: const pdfjs = await import("pdfjs-dist");
  // 2. set worker: pdfjs.GlobalWorkerOptions.workerSrc = `/pdfjs/pdf.worker.min.mjs`;
  //    (copy the worker file into /public/pdfjs/ via a setup step in TASKS)
  // 3. read the file as ArrayBuffer, getDocument({ data })
  // 4. iterate pages 1..N; collect getTextContent().items.map(it => it.str).join(" ")
  // 5. track running charStart/charEnd offsets to build the `pages` array
  // 6. if doc.numPages > 200 -> throw "this PDF is too long; split it first"
  // 7. if assembled text < 50 chars -> throw "this PDF appears to be image-only"
  void file;
  throw new Error("extractPdfText not implemented; see T3.2 in TASKS.md");
}
