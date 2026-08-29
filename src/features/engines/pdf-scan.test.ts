import { describe, test, expect } from "vitest";
import { createPdfScanAdapter } from "./pdf-scan";

describe("PDF Scan Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfScanAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfScanAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
