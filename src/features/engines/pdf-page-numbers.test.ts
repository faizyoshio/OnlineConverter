import { describe, test, expect } from "vitest";
import { createValidPdfFile } from "@/test/fixtures/pdf";
import { createPdfPageNumbersAdapter } from "./pdf-page-numbers";

describe("PDF Page Numbers Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfPageNumbersAdapter();
    const probe = await adapter.probe(await createValidPdfFile(2));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfPageNumbersAdapter();
    const issues = await adapter.validate([], { start: 1, position: "bottom-center", style: "arabic" });
    expect(issues).toEqual([]);
  });
});
