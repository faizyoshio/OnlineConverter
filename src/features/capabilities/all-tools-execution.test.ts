import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { capabilityRegistry, validateOptionValues } from "./index";
import { capabilityValidator } from "../validation/capability-validator";
import { createActiveEngineRouter } from "../workers/active-router";
import { VALID_PNG_BYTES } from "@/test/fixtures/pdf-inputs";
import { VALID_JPEG_BYTES } from "@/test/fixtures/image-inputs";
import { HEADERS } from "@/test/fixtures/headers";
import { createDocx, createPptx, createXlsx } from "@/engines/office/openxml";

function defaultOptions(capability: (typeof capabilityRegistry)[number]): Readonly<Record<string, unknown>> {
  return Object.freeze(Object.fromEntries(capability.optionFields.map((field) => [field.key, field.defaultValue])));
}

async function createSampleFiles(capabilityId: string): Promise<File[]> {
  if (capabilityId === "pdf.image-to-pdf") {
    return [new File([VALID_PNG_BYTES], "sample.png", { type: "image/png" })];
  }
  if (capabilityId === "pdf.jpg-to-pdf") {
    return [new File([VALID_JPEG_BYTES], "sample.jpg", { type: "image/jpeg" })];
  }
  if (capabilityId === "pdf.word-to-pdf") {
    const docxBytes = await createDocx(["Sample thesis draft"]);
    return [new File([docxBytes.buffer as ArrayBuffer], "sample.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })];
  }
  if (capabilityId === "pdf.powerpoint-to-pdf") {
    const pptxBytes = await createPptx(["Sample slide 1"]);
    return [new File([pptxBytes.buffer as ArrayBuffer], "sample.pptx", { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" })];
  }
  if (capabilityId === "pdf.excel-to-pdf") {
    const xlsxBytes = await createXlsx([["Col1", "Col2"], ["Val1", "Val2"]]);
    return [new File([xlsxBytes.buffer as ArrayBuffer], "sample.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })];
  }
  if (capabilityId === "pdf.text-to-pdf") {
    return [new File([HEADERS.text as BlobPart], "sample.txt", { type: "text/plain" })];
  }
  if (capabilityId === "image.compress-jpg" || capabilityId === "image.compress-jpeg" || capabilityId === "image.to-png") {
    return [new File([VALID_JPEG_BYTES as BlobPart], "sample.jpg", { type: "image/jpeg" })];
  }
  if (capabilityId === "image.compress-webp" || capabilityId === "image.webp-to-jpg") {
    return [new File([HEADERS.webp as BlobPart], "sample.webp", { type: "image/webp" })];
  }
  if (capabilityId === "image.compress-bmp") {
    return [new File([HEADERS.bmp as BlobPart], "sample.bmp", { type: "image/bmp" })];
  }
  if (capabilityId === "image.compress-heic" || capabilityId === "image.heic-to-jpg") {
    return [new File([HEADERS.heic as BlobPart], "sample.heic", { type: "image/heic" })];
  }
  if (capabilityId.startsWith("image.")) {
    return [new File([VALID_PNG_BYTES], "sample.png", { type: "image/png" })];
  }

  const doc = await PDFDocument.create();
  doc.addPage([612, 792]);
  doc.addPage([612, 792]);
  doc.addPage([612, 792]);
  const pdfBytes = await doc.save();
  const pdfFile = new File([pdfBytes.buffer as ArrayBuffer], "sample.pdf", { type: "application/pdf" });

  if (capabilityId === "pdf.merge") {
    const doc2 = await PDFDocument.create();
    doc2.addPage([612, 792]);
    const pdfBytes2 = await doc2.save();
    const pdf2 = new File([pdfBytes2.buffer as ArrayBuffer], "sample2.pdf", { type: "application/pdf" });
    return [pdfFile, pdf2];
  }

  if (capabilityId === "pdf.merge-image") {
    return [pdfFile, new File([VALID_PNG_BYTES], "sample.png", { type: "image/png" })];
  }

  return [pdfFile];
}

describe("All 39 active tools end-to-end audit", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn(async () => ({
        width: 800,
        height: 600,
        close: () => undefined,
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const router = createActiveEngineRouter();
  const activeTools = capabilityRegistry.filter((c) => c.releaseStatus === "active");

  test("contains exactly 39 active tools across 8 groups", () => {
    expect(activeTools).toHaveLength(39);
    const optimizePdfTools = activeTools.filter((c) => c.group === "optimize-pdf");
    const mergeSplitTools = activeTools.filter((c) => c.group === "merge-split");
    const viewEditTools = activeTools.filter((c) => c.group === "view-edit");
    const toPdfTools = activeTools.filter((c) => c.group === "to-pdf");
    const fromPdfTools = activeTools.filter((c) => c.group === "from-pdf");
    const pdfSecurityTools = activeTools.filter((c) => c.group === "pdf-security");
    const optimizeImageTools = activeTools.filter((c) => c.group === "optimize-image");
    const convertImageTools = activeTools.filter((c) => c.group === "convert-image");

    expect(optimizePdfTools).toHaveLength(1);
    expect(mergeSplitTools).toHaveLength(3);
    expect(viewEditTools).toHaveLength(7);
    expect(toPdfTools).toHaveLength(6);
    expect(fromPdfTools).toHaveLength(6);
    expect(pdfSecurityTools).toHaveLength(2);
    expect(optimizeImageTools).toHaveLength(7);
    expect(convertImageTools).toHaveLength(6);
  });

  for (const tool of activeTools) {
    test(`[${tool.id}] (${tool.slug}): validates default options and runs with sample inputs`, async () => {
      const defaults = defaultOptions(tool);
      expect(() => validateOptionValues(tool, defaults)).not.toThrow();

      expect(router.has(tool.adapterKey)).toBe(true);
      const adapter = await router.load(tool.adapterKey);
      expect(adapter).toBeDefined();

      const files = await createSampleFiles(tool.id);
      const cheapIssues = await capabilityValidator.validateCheap(tool, files, defaults);
      expect(cheapIssues, `Cheap issues for ${tool.id}: ${JSON.stringify(cheapIssues)}`).toEqual([]);

      const fullIssues = await capabilityValidator.validateWithAdapter(tool, files, defaults, adapter);
      expect(fullIssues, `Validation issues for ${tool.id}: ${JSON.stringify(fullIssues)}`).toEqual([]);
    });
  }
});