import { describe, test, expect } from "vitest";
import { createImagePngToJpgAdapter } from "./image-png-to-jpg";

describe("PNG to JPG Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImagePngToJpgAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("png");
  });
  test("validate returns empty", async () => {
    const adapter = createImagePngToJpgAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
