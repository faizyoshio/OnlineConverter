import { describe, test, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  mergePdfs,
  splitPdf,
  rotatePdfPages,
  deletePdfPages,
  extractPdfPages,
  organizePdf,
  addPageNumbers,
  watermarkPdf,
  textToPdf,
  cropPdfPages,
  resizePdfPagesToA4,
} from "./operations";

async function createSamplePdf(pageCount: number = 3): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) {
    const page = pdf.addPage([200, 200]);
    page.drawText(`Page ${i + 1}`, { x: 50, y: 100, size: 12 });
  }
  return pdf.save();
}

describe("PDF Operations Engine", () => {
  test("mergePdfs combines multiple PDFs into one", async () => {
    const pdf1 = await createSamplePdf(2);
    const pdf2 = await createSamplePdf(3);

    const merged = await mergePdfs([pdf1, pdf2]);
    const doc = await PDFDocument.load(merged);

    expect(doc.getPageCount()).toBe(5);
  });

  test("splitPdf splits PDF by ranges", async () => {
    const pdf = await createSamplePdf(5);
    const split = await splitPdf(pdf, [
      [0, 1], // pages 1-2
      [2, 4], // pages 3-5
    ]);

    expect(split.length).toBe(2);
    const doc1 = await PDFDocument.load(split[0]!);
    const doc2 = await PDFDocument.load(split[1]!);
    expect(doc1.getPageCount()).toBe(2);
    expect(doc2.getPageCount()).toBe(3);
  });

  test("rotatePdfPages rotates specific pages", async () => {
    const pdf = await createSamplePdf(3);
    const rotated = await rotatePdfPages(pdf, [0, 2], 90);
    const doc = await PDFDocument.load(rotated);

    expect(doc.getPage(0).getRotation().angle).toBe(90);
    expect(doc.getPage(1).getRotation().angle).toBe(0);
    expect(doc.getPage(2).getRotation().angle).toBe(90);
  });

  test("deletePdfPages removes specified pages", async () => {
    const pdf = await createSamplePdf(4);
    const result = await deletePdfPages(pdf, [1, 2]); // delete pages 2 and 3
    const doc = await PDFDocument.load(result);

    expect(doc.getPageCount()).toBe(2);
  });

  test("deletePdfPages throws when deleting all pages", async () => {
    const pdf = await createSamplePdf(2);
    await expect(deletePdfPages(pdf, [0, 1])).rejects.toThrow(/cannot delete all/i);
  });

  test("extractPdfPages keeps only specified pages", async () => {
    const pdf = await createSamplePdf(4);
    const extracted = await extractPdfPages(pdf, [1, 3]);
    const doc = await PDFDocument.load(extracted);

    expect(doc.getPageCount()).toBe(2);
  });

  test("organizePdf reorders pages", async () => {
    const pdf = await createSamplePdf(3);
    const organized = await organizePdf(pdf, [2, 0, 1]);
    const doc = await PDFDocument.load(organized);

    expect(doc.getPageCount()).toBe(3);
  });

  test("addPageNumbers adds footer numbers to all pages", async () => {
    const pdf = await createSamplePdf(3);
    const result = await addPageNumbers(pdf, { startNumber: 1 });
    const doc = await PDFDocument.load(result);

    expect(doc.getPageCount()).toBe(3);
    expect(result.byteLength).toBeGreaterThan(pdf.byteLength);
  });

  test("watermarkPdf adds text watermark", async () => {
    const pdf = await createSamplePdf(2);
    const watermarked = await watermarkPdf(pdf, "CONFIDENTIAL", { opacity: 0.5 });
    const doc = await PDFDocument.load(watermarked);

    expect(doc.getPageCount()).toBe(2);
    expect(watermarked.byteLength).toBeGreaterThan(pdf.byteLength);
  });

  test("textToPdf creates a PDF from text", async () => {
    const text = "Hello World!\nThis is a test document.\nMultiple lines of content.";
    const pdf = await textToPdf(text);
    const doc = await PDFDocument.load(pdf);

    expect(doc.getPageCount()).toBe(1);
    expect(pdf.byteLength).toBeGreaterThan(0);
  });

  test("cropPdfPages changes only selected CropBoxes", async () => {
    const source = await createSamplePdf(2);
    const cropped = await cropPdfPages(source, [1], { left: 10, top: 20, right: 30, bottom: 40 });
    const document = await PDFDocument.load(cropped);

    expect(document.getPage(0).getCropBox()).toEqual({ x: 0, y: 0, width: 200, height: 200 });
    expect(document.getPage(1).getCropBox()).toEqual({ x: 10, y: 40, width: 160, height: 140 });
  });

  test("cropPdfPages rejects margins that remove the visible page", async () => {
    await expect(cropPdfPages(await createSamplePdf(1), [0], { left: 100, top: 0, right: 100, bottom: 0 })).rejects.toThrow("positive");
  });

  test("resizePdfPagesToA4 preserves page count and fits every page on A4", async () => {
    const resized = await resizePdfPagesToA4(await createSamplePdf(2));
    const document = await PDFDocument.load(resized);

    expect(document.getPageCount()).toBe(2);
    for (const page of document.getPages()) {
      expect(page.getWidth()).toBeCloseTo(595.28, 2);
      expect(page.getHeight()).toBeCloseTo(841.89, 2);
    }
  });

  test("resizePdfPagesToA4 supports blank source pages", async () => {
    const source = await PDFDocument.create();
    source.addPage([400, 200]);
    source.addPage([200, 400]);

    const resized = await resizePdfPagesToA4(await source.save());
    await expect(PDFDocument.load(resized)).resolves.toEqual(expect.objectContaining({}));
  });
});
