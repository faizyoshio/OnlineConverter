import { describe, test, expect } from "vitest";
import { createHtmlToPdfAdapter } from "./html-to-pdf";

describe("HTML to PDF Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createHtmlToPdfAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("html");
  });
  test("validate returns empty", async () => {
    const adapter = createHtmlToPdfAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
