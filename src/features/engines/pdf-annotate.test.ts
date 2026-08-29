import { describe, test, expect } from "vitest";
import { createPdfAnnotateAdapter } from "./pdf-annotate";

describe("PDF Annotate Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfAnnotateAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfAnnotateAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
