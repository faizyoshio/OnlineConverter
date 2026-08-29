import { describe, test, expect } from "vitest";
import { createPdfToImageAdapter } from "./pdf-to-image";

describe("PDF to Image Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfToImageAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfToImageAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
