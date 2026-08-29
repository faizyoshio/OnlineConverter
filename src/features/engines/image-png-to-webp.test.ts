import { describe, test, expect } from "vitest";
import { createImagePngToWebpAdapter } from "./image-png-to-webp";

describe("PNG to WebP Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImagePngToWebpAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("png");
  });
  test("validate returns empty", async () => {
    const adapter = createImagePngToWebpAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
