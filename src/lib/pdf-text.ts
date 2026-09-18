import "client-only";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Set worker path relative to root public folder
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.mjs";
}

export async function extractPdfText(buffer: Uint8Array): Promise<string[]> {
  const doc = await pdfjsLib.getDocument({ data: buffer, disableAutoFetch: true }).promise;
  const texts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    texts.push((content as { items: Array<{ str: string }> }).items.map((x) => x.str).join(" "));
  }
  return texts;
}