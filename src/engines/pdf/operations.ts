/**
 * Browser-first PDF operations using pdf-lib.
 * All operations operate entirely in-memory using typed arrays.
 */

import "client-only";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

export async function mergePdfs(pdfBuffers: readonly Uint8Array[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  for (const buffer of pdfBuffers) {
    const pdf = await PDFDocument.load(buffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    for (const page of copiedPages) {
      mergedPdf.addPage(page);
    }
  }
  return mergedPdf.save();
}

export async function splitPdf(
  pdfBuffer: Uint8Array,
  ranges: readonly (readonly [number, number])[],
): Promise<Uint8Array[]> {
  const sourcePdf = await PDFDocument.load(pdfBuffer);
  const totalPages = sourcePdf.getPageCount();
  const results: Uint8Array[] = [];

  for (const [start, end] of ranges) {
    const subPdf = await PDFDocument.create();
    const indices: number[] = [];
    for (let i = Math.max(0, start); i <= Math.min(totalPages - 1, end); i++) {
      indices.push(i);
    }
    if (indices.length > 0) {
      const pages = await subPdf.copyPages(sourcePdf, indices);
      for (const page of pages) {
        subPdf.addPage(page);
      }
      results.push(await subPdf.save());
    }
  }

  return results;
}

export async function rotatePdfPages(
  pdfBuffer: Uint8Array,
  pageIndices: readonly number[],
  angleDegrees: number,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const totalPages = pdf.getPageCount();

  for (const index of pageIndices) {
    if (index >= 0 && index < totalPages) {
      const page = pdf.getPage(index);
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + angleDegrees) % 360));
    }
  }

  return pdf.save();
}

export async function deletePdfPages(
  pdfBuffer: Uint8Array,
  pageIndicesToDelete: readonly number[],
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const totalPages = pdf.getPageCount();
  const toDelete = new Set(pageIndicesToDelete.filter((i) => i >= 0 && i < totalPages));

  if (toDelete.size >= totalPages) {
    throw new Error("Cannot delete all pages from PDF");
  }

  // Delete from highest index to lowest so indices remain valid
  const sorted = Array.from(toDelete).sort((a, b) => b - a);
  for (const index of sorted) {
    pdf.removePage(index);
  }

  return pdf.save();
}

export async function extractPdfPages(
  pdfBuffer: Uint8Array,
  pageIndicesToExtract: readonly number[],
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(pdfBuffer);
  const totalPages = sourcePdf.getPageCount();
  const validIndices = pageIndicesToExtract.filter((i) => i >= 0 && i < totalPages);

  if (validIndices.length === 0) {
    throw new Error("No valid pages selected for extraction");
  }

  const resultPdf = await PDFDocument.create();
  const pages = await resultPdf.copyPages(sourcePdf, validIndices);
  for (const page of pages) {
    resultPdf.addPage(page);
  }

  return resultPdf.save();
}

export async function organizePdf(
  pdfBuffer: Uint8Array,
  newOrder: readonly number[],
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(pdfBuffer);
  const totalPages = sourcePdf.getPageCount();
  const validIndices = newOrder.filter((i) => i >= 0 && i < totalPages);

  const resultPdf = await PDFDocument.create();
  const pages = await resultPdf.copyPages(sourcePdf, validIndices);
  for (const page of pages) {
    resultPdf.addPage(page);
  }

  return resultPdf.save();
}

export async function addPageNumbers(
  pdfBuffer: Uint8Array,
  options: { startNumber?: number; fontSize?: number } = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const startNum = options.startNumber ?? 1;
  const fontSize = options.fontSize ?? 10;
  const totalPages = pdf.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    const page = pdf.getPage(i);
    const { width } = page.getSize();
    const text = `${startNum + i}`;
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y: 20,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  return pdf.save();
}

export async function watermarkPdf(
  pdfBuffer: Uint8Array,
  watermarkText: string,
  options: { opacity?: number; fontSize?: number } = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const opacity = options.opacity ?? 0.3;
  const fontSize = options.fontSize ?? 48;
  const totalPages = pdf.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    const page = pdf.getPage(i);
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
    page.drawText(watermarkText, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity,
      rotate: degrees(45),
    });
  }

  return pdf.save();
}

export async function textToPdf(text: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  const lineHeight = 16;
  const margin = 50;
  const pageWidth = 595.28; // A4 width
  const pageHeight = 841.89; // A4 height
  const maxLineWidth = pageWidth - 2 * margin;

  const lines = text.split(/\r?\n/);
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  for (const rawLine of lines) {
    // Simple line wrap
    const words = rawLine.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxLineWidth && currentLine) {
        if (y < margin + lineHeight) {
          page = pdf.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        page.drawText(currentLine, { x: margin, y, size: fontSize, font });
        y -= lineHeight;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine || words.length === 0) {
      if (y < margin + lineHeight) {
        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(currentLine, { x: margin, y, size: fontSize, font });
      y -= lineHeight;
    }
  }

  return pdf.save();
}

export async function imagesToPdf(
  images: readonly { bytes: Uint8Array; format: "jpeg" | "png" }[],
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  for (const img of images) {
    const embedded =
      img.format === "jpeg"
        ? await pdf.embedJpg(img.bytes)
        : await pdf.embedPng(img.bytes);

    const { width, height } = embedded.scale(1);
    const page = pdf.addPage([width, height]);
    page.drawImage(embedded, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  return pdf.save();
}
