import { describe, test, expect } from "vitest";
import { createPdfExtractPagesAdapter } from "./pdf-extract-pages";

describe("PDF Extract Pages Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfExtractPagesAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfExtractPagesAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
