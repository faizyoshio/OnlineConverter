import { describe, test, expect } from "vitest";
import { createImageCompressPngAdapter } from "./image-compress-png";

describe("Compress PNG Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageCompressPngAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("png");
  });
  test("validate returns empty", async () => {
    const adapter = createImageCompressPngAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
