import { describe, test, expect } from "vitest";
import { createImageWatermarkAdapter } from "./image-watermark";

describe("Image Watermark Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageWatermarkAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("png");
  });
  test("validate returns empty", async () => {
    const adapter = createImageWatermarkAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
