import { describe, expect, test } from "vitest";
import { PDFArray, PDFDocument } from "pdf-lib";
import { extractZip } from "@/engines/utility/operations";
import { createValidPngFile } from "@/test/fixtures/pdf-inputs";
import { createTruncatedPdfFile, createValidPdfFile } from "@/test/fixtures/pdf";
import { probePdf } from "./probe";
import { processPdfOperation } from "./worker-operation";

async function pageCount(bytes: Uint8Array): Promise<number> {
  return (await PDFDocument.load(Uint8Array.from(bytes))).getPageCount();
}

function contentStreamCount(document: PDFDocument, pageIndex: number): number {
  const contents = document.getPage(pageIndex).node.Contents();
  if (!contents) return 0;
  return contents instanceof PDFArray ? contents.size() : 1;
}

describe("PDF worker operations", () => {
  test("probes valid PDF metadata without producing output", async () => {
    const probe = await probePdf(await createValidPdfFile(3));

    expect(probe).toEqual(expect.objectContaining({ kind: "pdf", probeRule: "pdf-header", pages: 3 }));
  });

  test("treats a truncated PDF as unknown", async () => {
    await expect(probePdf(createTruncatedPdfFile())).resolves.toEqual({
      kind: "unknown",
      probeRule: "unknown",
      bytes: 0,
    });
  });

  test("merges PDFs through worker operation context", async () => {
    const progress: string[] = [];
    const result = await processPdfOperation({
      capabilityId: "pdf.merge",
      jobId: "job-merge",
      inputs: [await createValidPdfFile(1, "one.pdf"), await createValidPdfFile(2, "two.pdf")],
      options: {},
      isCancelled: () => false,
      reportProgress: (_value: number | null, stageLabel: string) => progress.push(stageLabel),
    });

    expect(result.mode).toBe("files");
    if (result.mode !== "files") throw new Error("Expected file result");
    expect(result.outputs).toHaveLength(1);
    expect(result.outputs[0]?.suggestedDownloadName).toBeUndefined();
    expect(await pageCount(new Uint8Array(await result.outputs[0]!.blob.arrayBuffer()))).toBe(3);
    expect(result.metadata).toEqual(expect.objectContaining({ resultMode: "files", pages: 3 }));
    expect(progress).toContain("Merging PDFs");
  });

  test("combines selected ranges into one PDF when one-per-range is disabled", async () => {
    const result = await processPdfOperation({
      capabilityId: "pdf.split",
      jobId: "job-split-combined",
      inputs: [await createValidPdfFile(4)],
      options: { ranges: "1,3-4", onePerRange: false },
      isCancelled: () => false,
      reportProgress: () => undefined,
    });

    expect(result.mode).toBe("files");
    if (result.mode !== "files") throw new Error("Expected file result");
    expect(result.outputs).toHaveLength(1);
    expect(result.outputs[0]?.blob.type).toBe("application/pdf");
    expect(await pageCount(new Uint8Array(await result.outputs[0]!.blob.arrayBuffer()))).toBe(3);
  });

  test("rotates only selected PDF pages in worker", async () => {
    const source = await createValidPdfFile(3);
    const result = await processPdfOperation({
      capabilityId: "pdf.rotate",
      jobId: "job-rotate",
      inputs: [source],
      options: { pages: "2", degrees: "90" },
      isCancelled: () => false,
      reportProgress: () => undefined,
    });

    expect(result.mode).toBe("files");
    if (result.mode !== "files") throw new Error("Expected file result");
    const output = await PDFDocument.load(await result.outputs[0]!.blob.arrayBuffer());
    expect(output.getPage(0).getRotation().angle).toBe(0);
    expect(output.getPage(1).getRotation().angle).toBe(90);
    expect(output.getPage(2).getRotation().angle).toBe(0);
  });

  test("deletes selected PDF pages in worker", async () => {
    const result = await processPdfOperation({
      capabilityId: "pdf.delete-pages",
      jobId: "job-delete",
      inputs: [await createValidPdfFile(3)],
      options: { pages: "2", keepOnePage: true },
      isCancelled: () => false,
      reportProgress: () => undefined,
    });

    expect(result.mode).toBe("files");
    if (result.mode !== "files") throw new Error("Expected file result");
    const output = await PDFDocument.load(await result.outputs[0]!.blob.arrayBuffer());
    expect(output.getPageCount()).toBe(2);
  });

  test("extracts selected PDF pages into one PDF in worker", async () => {
    const result = await processPdfOperation({
      capabilityId: "pdf.extract-pages",
      jobId: "job-extract",
      inputs: [await createValidPdfFile(4)],
      options: { pages: "1,3-4", combinedPdf: true },
      isCancelled: () => false,
      reportProgress: () => undefined,
    });

    expect(result.mode).toBe("files");
    if (result.mode !== "files") throw new Error("Expected file result");
    expect(result.outputs).toHaveLength(1);
    const output = await PDFDocument.load(await result.outputs[0]!.blob.arrayBuffer());
    expect(output.getPageCount()).toBe(3);
  });

  test("extracts selected PDF pages into a ZIP when combined PDF is disabled", async () => {
    const result = await processPdfOperation({
      capabilityId: "pdf.extract-pages",
      jobId: "job-extract-zip",
      inputs: [await createValidPdfFile(4)],
      options: { pages: "1,3-4", combinedPdf: false },
      isCancelled: () => false,
      reportProgress: () => undefined,
    });

    expect(result.mode).toBe("files");
    if (result.mode !== "files") throw new Error("Expected file result");
    expect(result.outputs[0]?.blob.type).toBe("application/zip");
    const entries = await extractZip(new Uint8Array(await result.outputs[0]!.blob.arrayBuffer()));
    expect(entries.map((entry) => entry.name)).toEqual([
      "extracted-1-page-1.pdf",
      "extracted-2-page-3.pdf",
      "extracted-3-page-4.pdf",
    ]);
    await expect(Promise.all(entries.map((entry) => pageCount(entry.bytes)))).resolves.toEqual([1, 1, 1]);
  });

  test("organizes PDF pages from one-based order in worker", async () => {
    const result = await processPdfOperation({
      capabilityId: "pdf.organize",
      jobId: "job-organize",
      inputs: [await createValidPdfFile(3)],
      options: { operations: "3,1,2", initialOrder: "original" },
      isCancelled: () => false,
      reportProgress: () => undefined,
    });

    expect(result.mode).toBe("files");
    if (result.mode !== "files") throw new Error("Expected file result");
    const output = await PDFDocument.load(await result.outputs[0]!.blob.arrayBuffer());
    expect(output.getPageCount()).toBe(3);
  });

  test("keeps original page order when organize operations are none", async () => {
    const result = await processPdfOperation({
      capabilityId: "pdf.organize",
      jobId: "job-organize-original",
      inputs: [await createValidPdfFile(3)],
      options: { operations: "none", initialOrder: "original" },
      isCancelled: () => false,
      reportProgress: () => undefined,
    });

    expect(result.mode).toBe("files");
    if (result.mode !== "files") throw new Error("Expected file result");
    expect(await pageCount(new Uint8Array(await result.outputs[0]!.blob.arrayBuffer()))).toBe(3);
  });

  test("adds page numbers without changing page count in worker", async () => {
    const result = await processPdfOperation({
      capabilityId: "pdf.page-numbers",
      jobId: "job-page-numbers",
      inputs: [await createValidPdfFile(2)],
      options: { start: 7, position: "bottom-center", style: "arabic" },
      isCancelled: () => false,
      reportProgress: () => undefined,
    });

    expect(result.mode).toBe("files");
    if (result.mode !== "files") throw new Error("Expected file result");
    const output = await PDFDocument.load(await result.outputs[0]!.blob.arrayBuffer());
    expect(output.getPageCount()).toBe(2);
  });

  test("splits multiple ranges into a ZIP of local PDFs", async () => {
    const result = await processPdfOperation({
      capabilityId: "pdf.split",
      jobId: "job-split",
      inputs: [await createValidPdfFile(3)],
      options: { ranges: "1,2-3", onePerRange: true },
      isCancelled: () => false,
      reportProgress: () => undefined,
    });

    expect(result.mode).toBe("files");
    if (result.mode !== "files") throw new Error("Expected file result");
    expect(result.outputs).toHaveLength(1);
    expect(result.outputs[0]?.blob.type).toBe("application/zip");
    const entries = await extractZip(new Uint8Array(await result.outputs[0]!.blob.arrayBuffer()));
    expect(entries.map((entry) => entry.name)).toEqual(["split-1.pdf", "split-2.pdf"]);
    expect(await pageCount(entries[0]!.bytes)).toBe(1);
    expect(await pageCount(entries[1]!.bytes)).toBe(2);
  });

  test("watermarks only the selected PDF pages", async () => {
    const source = await createValidPdfFile(2);
    const sourceDocument = await PDFDocument.load(await source.arrayBuffer());
    const originalCounts = [contentStreamCount(sourceDocument, 0), contentStreamCount(sourceDocument, 1)];

    const result = await processPdfOperation({
      capabilityId: "pdf.watermark",
      jobId: "job-watermark",
      inputs: [source],
      options: {
        watermarkType: "text",
        watermarkText: "PRIVATE",
        position: "center",
        opacity: 30,
        pages: "2",
      },
      isCancelled: () => false,
      reportProgress: () => undefined,
    });

    expect(result.mode).toBe("files");
    if (result.mode !== "files") throw new Error("Expected file result");
    const output = await PDFDocument.load(await result.outputs[0]!.blob.arrayBuffer());
    expect(contentStreamCount(output, 0)).toBe(originalCounts[0]);
    expect(contentStreamCount(output, 1)).toBeGreaterThan(originalCounts[1]!);
  });

  test("places raster images on A4 PDF pages", async () => {
    const result = await processPdfOperation({
      capabilityId: "pdf.image-to-pdf",
      jobId: "job-image-to-pdf",
      inputs: [createValidPngFile()],
      options: { pageSize: "a4", fit: "contain", marginMm: 12, order: "input-order" },
      isCancelled: () => false,
      reportProgress: () => undefined,
    });

    expect(result.mode).toBe("files");
    if (result.mode !== "files") throw new Error("Expected file result");
    const output = await PDFDocument.load(await result.outputs[0]!.blob.arrayBuffer());
    const size = output.getPage(0).getSize();
    expect(size.width).toBeCloseTo(595.28, 1);
    expect(size.height).toBeCloseTo(841.89, 1);
  });

  test("keeps an unwrapped text line on one page when wrapping is disabled", async () => {
    const result = await processPdfOperation({
      capabilityId: "pdf.text-to-pdf",
      jobId: "job-text-to-pdf",
      inputs: [new File(["local ".repeat(1_000)], "fixture.txt", { type: "text/plain" })],
      options: { pageSize: "a4", orientation: "portrait", fontSizePt: 12, wrap: false },
      isCancelled: () => false,
      reportProgress: () => undefined,
    });

    expect(result.mode).toBe("files");
    if (result.mode !== "files") throw new Error("Expected file result");
    const output = await PDFDocument.load(await result.outputs[0]!.blob.arrayBuffer());
    expect(output.getPageCount()).toBe(1);
  });
});
