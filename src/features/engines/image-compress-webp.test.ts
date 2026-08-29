import { describe, test, expect } from "vitest";
import { createImageCompressWebpAdapter } from "./image-compress-webp";

describe("Compress WebP Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageCompressWebpAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("webp");
  });
  test("validate returns empty", async () => {
    const adapter = createImageCompressWebpAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
