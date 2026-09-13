import { describe, test, expect } from "vitest";
import { createPdfOcrAdapter } from "./pdf-ocr";
import { createValidPdfFile } from "@/test/fixtures/pdf";

describe("PDF OCR Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfOcrAdapter();
    const probe = await adapter.probe(await createValidPdfFile(1));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfOcrAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
