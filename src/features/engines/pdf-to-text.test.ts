import { describe, test, expect } from "vitest";
import { createPdfToTextAdapter } from "./pdf-to-text";

describe("PDF to Text Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfToTextAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfToTextAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
