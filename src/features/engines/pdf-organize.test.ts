import { describe, test, expect } from "vitest";
import { createValidPdfFile } from "@/test/fixtures/pdf";
import { createPdfOrganizeAdapter } from "./pdf-organize";

describe("PDF Organize Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfOrganizeAdapter();
    const probe = await adapter.probe(await createValidPdfFile(2));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfOrganizeAdapter();
    const issues = await adapter.validate([], { operations: "none" });
    expect(issues).toEqual([]);
  });
});
