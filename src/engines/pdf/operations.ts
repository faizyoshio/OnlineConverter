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
  options: { opacity?: number; fontSize?: number; pageIndices?: readonly number[] } = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const opacity = options.opacity ?? 0.3;
  const fontSize = options.fontSize ?? 48;
  const totalPages = pdf.getPageCount();
  const selectedPages = options.pageIndices ? new Set(options.pageIndices) : null;

  for (let i = 0; i < totalPages; i++) {
    if (selectedPages && !selectedPages.has(i)) continue;
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

export async function imageWatermarkPdf(
  pdfBuffer: Uint8Array,
  watermark: { bytes: Uint8Array; format: "jpeg" | "png" },
  options: { opacity?: number; pageIndices?: readonly number[] } = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer);
  const embedded = watermark.format === "jpeg"
    ? await pdf.embedJpg(watermark.bytes)
    : await pdf.embedPng(watermark.bytes);
  const selectedPages = options.pageIndices ? new Set(options.pageIndices) : null;

  for (let index = 0; index < pdf.getPageCount(); index += 1) {
    if (selectedPages && !selectedPages.has(index)) continue;
    const page = pdf.getPage(index);
    const pageSize = page.getSize();
    const scale = Math.min(
      (pageSize.width * 0.5) / embedded.width,
      (pageSize.height * 0.5) / embedded.height,
    );
    const width = embedded.width * scale;
    const height = embedded.height * scale;
    page.drawImage(embedded, {
      x: (pageSize.width - width) / 2,
      y: (pageSize.height - height) / 2,
      width,
      height,
      opacity: options.opacity ?? 0.3,
    });
  }

  return pdf.save();
}

export async function textToPdf(
  text: string,
  options: { fontSize?: number; orientation?: "portrait" | "landscape"; wrap?: boolean } = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontSize = options.fontSize ?? 12;
  const lineHeight = fontSize * 1.35;
  const margin = 50;
  const portrait = [595.28, 841.89] as const;
  const [pageWidth, pageHeight] = options.orientation === "landscape"
    ? [portrait[1], portrait[0]]
    : portrait;
  const maxLineWidth = pageWidth - 2 * margin;

  const lines = text.split(/\r?\n/);
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  for (const rawLine of lines) {
    const wrappedLines: string[] = [];
    if (options.wrap === false) {
      wrappedLines.push(rawLine);
    } else {
      const words = rawLine.split(" ");
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (testWidth > maxLineWidth && currentLine) {
          wrappedLines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      wrappedLines.push(currentLine);
    }

    for (const line of wrappedLines) {
      if (y < margin + lineHeight) {
        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      page.drawText(line, { x: margin, y, size: fontSize, font });
      y -= lineHeight;
    }
  }

  return pdf.save();
}

export async function imagesToPdf(
  images: readonly { bytes: Uint8Array; format: "jpeg" | "png" }[],
  options: { fit?: "contain" | "cover" | "fill"; marginMm?: number } = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = (options.marginMm ?? 12) * (72 / 25.4);
  const availableWidth = pageWidth - 2 * margin;
  const availableHeight = pageHeight - 2 * margin;

  for (const img of images) {
    const embedded =
      img.format === "jpeg"
        ? await pdf.embedJpg(img.bytes)
        : await pdf.embedPng(img.bytes);

    const page = pdf.addPage([pageWidth, pageHeight]);
    let width = availableWidth;
    let height = availableHeight;
    if (options.fit !== "fill") {
      const scale = options.fit === "cover"
        ? Math.max(availableWidth / embedded.width, availableHeight / embedded.height)
        : Math.min(availableWidth / embedded.width, availableHeight / embedded.height);
      width = embedded.width * scale;
      height = embedded.height * scale;
    }
    page.drawImage(embedded, {
      x: (pageWidth - width) / 2,
      y: (pageHeight - height) / 2,
      width,
      height,
    });
  }

  return pdf.save();
}

export type PdfCropMargins = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export async function cropPdfPages(
  pdfBuffer: Uint8Array,
  pageIndices: readonly number[],
  margins: PdfCropMargins,
): Promise<Uint8Array> {
  const values = [margins.left, margins.top, margins.right, margins.bottom];
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("Crop margins must be finite non-negative values");
  }

  const pdf = await PDFDocument.load(pdfBuffer);
  const selected = new Set(pageIndices.filter((index) => Number.isInteger(index) && index >= 0 && index < pdf.getPageCount()));
  if (selected.size === 0) throw new Error("No valid pages selected for cropping");

  for (const index of selected) {
    const page = pdf.getPage(index);
    const current = page.getCropBox();
    const width = current.width - margins.left - margins.right;
    const height = current.height - margins.top - margins.bottom;
    if (width <= 0 || height <= 0) throw new Error("Crop margins must leave a positive visible page area");
    page.setCropBox(current.x + margins.left, current.y + margins.bottom, width, height);
  }

  return pdf.save();
}

export async function resizePdfPagesToA4(pdfBuffer: Uint8Array): Promise<Uint8Array> {
  const source = await PDFDocument.load(pdfBuffer);
  const output = await PDFDocument.create();
  const targetWidth = 595.28;
  const targetHeight = 841.89;

  for (const sourcePage of source.getPages()) {
    if (!sourcePage.node.Contents()) sourcePage.pushOperators();
    const cropBox = sourcePage.getCropBox();
    const embedded = await output.embedPage(sourcePage, {
      left: cropBox.x,
      bottom: cropBox.y,
      right: cropBox.x + cropBox.width,
      top: cropBox.y + cropBox.height,
    });
    const scale = Math.min(targetWidth / embedded.width, targetHeight / embedded.height);
    const width = embedded.width * scale;
    const height = embedded.height * scale;
    const page = output.addPage([targetWidth, targetHeight]);
    page.drawPage(embedded, {
      x: (targetWidth - width) / 2,
      y: (targetHeight - height) / 2,
      width,
      height,
    });
  }

  return output.save();
}

export async function flattenPdf(
  pdfBuffer: Uint8Array,
  options: { formAppearances?: boolean; annotations?: boolean } = {},
): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBuffer);
  if (options.formAppearances !== false) {
    try {
      const form = pdf.getForm();
      form.flatten();
    } catch {
      // document has no form fields or form is already flat
    }
  }
  return pdf.save();
}
