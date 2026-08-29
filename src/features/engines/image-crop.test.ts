import { describe, test, expect } from "vitest";
import { createImageCropAdapter } from "./image-crop";

describe("Image Crop Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageCropAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("png");
  });
  test("validate returns empty", async () => {
    const adapter = createImageCropAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
