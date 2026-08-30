import { describe, test, expect } from "vitest";
import { createValidPdfFile } from "@/test/fixtures/pdf";
import { createPdfDeletePagesAdapter } from "./pdf-delete-pages";

describe("PDF Delete Pages Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfDeletePagesAdapter();
    const probe = await adapter.probe(await createValidPdfFile(2));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfDeletePagesAdapter();
    const issues = await adapter.validate([], { pages: "1" });
    expect(issues).toEqual([]);
  });
});
