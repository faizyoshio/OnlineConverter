import { describe, test, expect } from "vitest";
import { createPdfToJpgAdapter } from "./pdf-to-jpg";

describe("PDF to JPG Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfToJpgAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfToJpgAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
