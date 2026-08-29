import { describe, test, expect } from "vitest";
import { createPdfFlattenAdapter } from "./pdf-flatten";

describe("PDF Flatten Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfFlattenAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfFlattenAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
