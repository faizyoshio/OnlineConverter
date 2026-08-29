import { describe, test, expect } from "vitest";
import { createPdfEditAdapter } from "./pdf-edit";

describe("PDF Edit Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfEditAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfEditAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
