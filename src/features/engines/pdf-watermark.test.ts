import { describe, test, expect } from "vitest";
import { createPdfWatermarkAdapter } from "./pdf-watermark";

describe("PDF Watermark Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfWatermarkAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfWatermarkAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
