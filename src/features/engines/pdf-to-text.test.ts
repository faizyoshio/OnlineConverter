import { describe, test, expect } from "vitest";
import { createPdfToTextAdapter } from "./pdf-to-text";
import { createValidPdfFile } from "@/test/fixtures/pdf";

describe("PDF to Text Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfToTextAdapter();
    const probe = await adapter.probe(await createValidPdfFile(1));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfToTextAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
