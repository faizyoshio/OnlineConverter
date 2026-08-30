import { describe, test, expect } from "vitest";
import { createValidPdfFile } from "@/test/fixtures/pdf";
import { createPdfRotateAdapter } from "./pdf-rotate";

describe("PDF Rotate Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfRotateAdapter();
    const probe = await adapter.probe(await createValidPdfFile(1));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfRotateAdapter();
    const issues = await adapter.validate([], { pages: "all", degrees: "90" });
    expect(issues).toEqual([]);
  });
});
