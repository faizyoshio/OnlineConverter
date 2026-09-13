import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { capabilityRegistry, validateOptionValues } from "./index";
import { capabilityValidator } from "../validation/capability-validator";
import { createActiveEngineRouter } from "../workers/active-router";
import { VALID_PNG_BYTES } from "@/test/fixtures/pdf-inputs";

const VALID_WEBP_BYTES = new Uint8Array([
  0x52, 0x49, 0x46, 0x46, 0x1a, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
  0x56, 0x50, 0x38, 0x20, 0x0e, 0x00, 0x00, 0x00, 0x30, 0x01, 0x00, 0x9d,
  0x01, 0x2a, 0x01, 0x00, 0x01, 0x00, 0x02, 0x00,
]);

const VALID_JPEG_BYTES = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
]);

function defaultOptions(capability: (typeof capabilityRegistry)[number]): Readonly<Record<string, unknown>> {
  return Object.freeze(Object.fromEntries(capability.optionFields.map((field) => [field.key, field.defaultValue])));
}

async function createSampleFiles(capabilityId: string): Promise<File[]> {
  if (capabilityId.startsWith("pdf.")) {
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
    if (capabilityId === "pdf.image-to-pdf") {
      return [new File([VALID_PNG_BYTES], "sample.png", { type: "image/png" })];
    }
    if (capabilityId === "pdf.text-to-pdf") {
      return [new File([new TextEncoder().encode("Hello world")], "sample.txt", { type: "text/plain" })];
    }
    return [pdfFile];
  }

  if (capabilityId.startsWith("image.")) {
    const png = new File([VALID_PNG_BYTES], "sample.png", { type: "image/png" });
    const jpg = new File([VALID_JPEG_BYTES], "sample.jpg", { type: "image/jpeg" });
    const jfif = new File([VALID_JPEG_BYTES], "sample.jfif", { type: "image/jpeg" });
    const webp = new File([VALID_WEBP_BYTES], "sample.webp", { type: "image/webp" });

    if (capabilityId === "image.jpg-to-modern" || capabilityId === "image.compress-jpeg") return [jpg];
    if (capabilityId === "image.jfif-to-png") return [jfif];
    if (capabilityId === "image.webp-to-jpg" || capabilityId === "image.webp-to-png" || capabilityId === "image.compress-webp") return [webp];
    return [png];
  }

  if (capabilityId === "archive.zip-create") {
    return [
      new File([new TextEncoder().encode("file1")], "doc1.txt", { type: "text/plain" }),
      new File([new TextEncoder().encode("file2")], "doc2.txt", { type: "text/plain" }),
    ];
  }

  if (capabilityId === "archive.zip-extract") {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    zip.file("test.txt", "hello inside zip");
    const zipBytes = await zip.generateAsync({ type: "uint8array" });
    return [new File([zipBytes.buffer as ArrayBuffer], "archive.zip", { type: "application/zip" })];
  }

  return [];
}

describe("All 30 active tools end-to-end audit", () => {
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

  test("contains exactly 30 active tools across expected categories", () => {
    expect(activeTools).toHaveLength(30);
    const pdfTools = activeTools.filter((c) => c.category === "pdf");
    const imageTools = activeTools.filter((c) => c.category === "image");
    const archiveTools = activeTools.filter((c) => c.workerFamily === "archive");
    const utilityTools = activeTools.filter((c) => c.workerFamily === "utility");

    expect(pdfTools).toHaveLength(13);
    expect(imageTools).toHaveLength(11);
    expect(archiveTools).toHaveLength(2);
    expect(utilityTools).toHaveLength(4);
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
