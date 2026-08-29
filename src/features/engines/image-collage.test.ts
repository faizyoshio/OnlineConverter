import { describe, test, expect } from "vitest";
import { createImageCollageAdapter } from "./image-collage";

describe("Image Collage Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageCollageAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("png");
  });
  test("validate returns empty", async () => {
    const adapter = createImageCollageAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
