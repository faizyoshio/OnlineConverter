import { describe, test, expect } from "vitest";
import { createPdfConverterAdapter } from "./pdf-converter";

describe("PDF Converter Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfConverterAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfConverterAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
