import { describe, test, expect } from "vitest";
import { createValidPdfFile } from "@/test/fixtures/pdf";
import { createPdfExtractPagesAdapter } from "./pdf-extract-pages";

describe("PDF Extract Pages Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfExtractPagesAdapter();
    const probe = await adapter.probe(await createValidPdfFile(2));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfExtractPagesAdapter();
    const issues = await adapter.validate([], { pages: "1" });
    expect(issues).toEqual([]);
  });
});
