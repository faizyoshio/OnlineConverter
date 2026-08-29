import { describe, test, expect } from "vitest";
import { createPdfCropAdapter } from "./pdf-crop";

describe("PDF Crop Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfCropAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfCropAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
