import { describe, test, expect } from "vitest";
import { createPdfOcrAdapter } from "./pdf-ocr";

describe("PDF OCR Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfOcrAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfOcrAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
