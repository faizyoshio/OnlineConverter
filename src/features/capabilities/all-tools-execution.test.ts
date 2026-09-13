import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { capabilityRegistry, validateOptionValues } from "./index";
import { capabilityValidator } from "../validation/capability-validator";
import { createActiveEngineRouter } from "../workers/active-router";
import { VALID_PNG_BYTES } from "@/test/fixtures/pdf-inputs";
import { createDocx, createPptx, createXlsx } from "@/engines/office/openxml";

function defaultOptions(capability: (typeof capabilityRegistry)[number]): Readonly<Record<string, unknown>> {
  return Object.freeze(Object.fromEntries(capability.optionFields.map((field) => [field.key, field.defaultValue])));
}

async function createSampleFiles(capabilityId: string): Promise<File[]> {
  if (capabilityId === "pdf.image-to-pdf" || capabilityId === "pdf.scan") {
    return [new File([VALID_PNG_BYTES], "sample.png", { type: "image/png" })];
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

  return [pdfFile];
}

describe("All 17 active tools end-to-end audit", () => {
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

  test("contains exactly 17 active tools across 4 groups", () => {
    expect(activeTools).toHaveLength(17);
    const organizeTools = activeTools.filter((c) => c.group === "organize");
    const optimizeTools = activeTools.filter((c) => c.group === "optimize");
    const toPdfTools = activeTools.filter((c) => c.group === "to-pdf");
    const fromPdfTools = activeTools.filter((c) => c.group === "from-pdf");

    expect(organizeTools).toHaveLength(6);
    expect(optimizeTools).toHaveLength(3);
    expect(toPdfTools).toHaveLength(4);
    expect(fromPdfTools).toHaveLength(4);
  });

  for (const tool of activeTools) {
    test(`[${tool.id}] (${tool.slug}): validates default options and runs with sample inputs`, async () => {
      // 1. Default options must pass schema validation
      const defaults = defaultOptions(tool);
      expect(() => validateOptionValues(tool, defaults)).not.toThrow();

      // 2. Adapter must be registered and loadable
      expect(router.has(tool.id)).toBe(true);
      const adapter = await router.load(tool.id);
      expect(adapter).toBeDefined();

      // 3. Inputs must pass cheap and adapter validation
      const files = await createSampleFiles(tool.id);
      const cheapIssues = await capabilityValidator.validateCheap(tool, files, defaults);
      expect(cheapIssues, `Cheap issues for ${tool.id}: ${JSON.stringify(cheapIssues)}`).toEqual([]);

      const fullIssues = await capabilityValidator.validateWithAdapter(tool, files, defaults, adapter);
      expect(fullIssues, `Validation issues for ${tool.id}: ${JSON.stringify(fullIssues)}`).toEqual([]);
    });
  }
});
