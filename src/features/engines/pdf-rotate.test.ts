import { describe, test, expect } from "vitest";
import { createPdfRotateAdapter } from "./pdf-rotate";

describe("PDF Rotate Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfRotateAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfRotateAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
