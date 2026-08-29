import { describe, test, expect } from "vitest";
import { createPdfDeletePagesAdapter } from "./pdf-delete-pages";

describe("PDF Delete Pages Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfDeletePagesAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfDeletePagesAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
