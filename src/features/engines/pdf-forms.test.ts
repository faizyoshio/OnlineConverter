import { describe, test, expect } from "vitest";
import { createPdfFormsAdapter } from "./pdf-forms";

describe("PDF Forms Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfFormsAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfFormsAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
