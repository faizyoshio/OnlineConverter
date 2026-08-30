import { PDFDocument } from "pdf-lib";

export const TRUNCATED_PDF_BYTES = new TextEncoder().encode("%PDF-1.7\ntruncated");

export async function createValidPdfBytes(pageCount = 1): Promise<Uint8Array> {
  if (!Number.isInteger(pageCount) || pageCount < 1) {
    throw new Error("A PDF fixture requires at least one page.");
  }

  const document = await PDFDocument.create();
  for (let index = 0; index < pageCount; index += 1) {
    const page = document.addPage([200, 200]);
    page.drawText(`Page ${index + 1}`, { x: 50, y: 100, size: 12 });
  }
  return document.save();
}

export async function createValidPdfFile(pageCount = 1, name = "fixture.pdf"): Promise<File> {
  const bytes = await createValidPdfBytes(pageCount);
  return new File([Uint8Array.from(bytes).buffer], name, { type: "application/pdf" });
}

export function createTruncatedPdfFile(name = "truncated.pdf"): File {
  return new File([Uint8Array.from(TRUNCATED_PDF_BYTES).buffer], name, { type: "application/pdf" });
}
