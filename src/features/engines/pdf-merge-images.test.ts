import { describe, test, expect } from "vitest";
import { createPdfMergeImagesAdapter } from "./pdf-merge-images";

describe("PDF Merge Images Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfMergeImagesAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfMergeImagesAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
