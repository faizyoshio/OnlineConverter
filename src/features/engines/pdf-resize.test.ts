import { describe, test, expect } from "vitest";
import { createPdfResizeAdapter } from "./pdf-resize";

describe("PDF Resize Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfResizeAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfResizeAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
