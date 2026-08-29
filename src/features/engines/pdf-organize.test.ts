import { describe, test, expect } from "vitest";
import { createPdfOrganizeAdapter } from "./pdf-organize";

describe("PDF Organize Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfOrganizeAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfOrganizeAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
