import { describe, test, expect } from "vitest";
import { createImageWebpToJpgAdapter } from "./image-webp-to-jpg";

describe("WebP to JPG Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageWebpToJpgAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("webp");
  });
  test("validate returns empty", async () => {
    const adapter = createImageWebpToJpgAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
