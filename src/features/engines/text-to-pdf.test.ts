import { describe, test, expect } from "vitest";
import { createTextToPdfAdapter } from "./text-to-pdf";

describe("Text to PDF Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createTextToPdfAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("text");
  });
  test("validate returns empty", async () => {
    const adapter = createTextToPdfAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
