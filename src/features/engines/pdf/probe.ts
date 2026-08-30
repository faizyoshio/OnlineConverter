import { PDFDocument } from "pdf-lib";
import type { FileProbe } from "@/features/validation/types";

export async function probePdf(file: File): Promise<FileProbe> {
  if (file.size < 5) {
    return { kind: "unknown", probeRule: "unknown", bytes: 0 };
  }
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const header = String.fromCharCode(...head);
  if (header !== "%PDF-") {
    return { kind: "unknown", probeRule: "unknown", bytes: 0 };
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    const pdf = await PDFDocument.load(bytes);
    const totalPages = pdf.getPageCount();
    const firstPage = pdf.getPage(0);
    const { width, height } = firstPage ? firstPage.getSize() : { width: 0, height: 0 };

    return {
      kind: "pdf",
      probeRule: "pdf-header",
      bytes: bytes.length,
      pages: totalPages,
      width,
      height,
    };
  } catch {
    return { kind: "unknown", probeRule: "unknown", bytes: 0 };
  }
}