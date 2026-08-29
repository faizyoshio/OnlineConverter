import { describe, test, expect } from "vitest";
import { createPdfPageNumbersAdapter } from "./pdf-page-numbers";

describe("PDF Page Numbers Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfPageNumbersAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfPageNumbersAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
