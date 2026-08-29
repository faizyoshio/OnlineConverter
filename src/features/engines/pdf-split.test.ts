import { describe, test, expect } from "vitest";
import { createPdfSplitAdapter } from "./pdf-split";

describe("PDF Split Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfSplitAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfSplitAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
