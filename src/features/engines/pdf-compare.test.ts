import { describe, test, expect } from "vitest";
import { createPdfCompareAdapter } from "./pdf-compare";

describe("PDF Compare Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfCompareAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfCompareAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
