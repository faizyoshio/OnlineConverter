import { describe, test, expect } from "vitest";
import { createImageWebpToPngAdapter } from "./image-webp-to-png";

describe("WebP to PNG Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageWebpToPngAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("webp");
  });
  test("validate returns empty", async () => {
    const adapter = createImageWebpToPngAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
