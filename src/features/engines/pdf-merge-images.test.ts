import { describe, test, expect } from "vitest";
import { createPdfMergeImagesAdapter } from "./pdf-merge-images";
import { createValidPdfFile } from "@/test/fixtures/pdf";

describe("PDF Merge Images Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfMergeImagesAdapter();
    const probe = await adapter.probe(await createValidPdfFile(1));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfMergeImagesAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
