import { describe, test, expect } from "vitest";
import { createImageJpgToWebpAdapter } from "./image-jpg-to-webp";

describe("JPG to WebP Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageJpgToWebpAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("jpeg");
  });
  test("validate returns empty", async () => {
    const adapter = createImageJpgToWebpAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
