import { describe, test, expect } from "vitest";
import { createHeicToPdfAdapter } from "./heic-to-pdf";

describe("HEIC to PDF Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createHeicToPdfAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("heic");
  });
  test("validate returns empty", async () => {
    const adapter = createHeicToPdfAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
