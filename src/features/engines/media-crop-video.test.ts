import { describe, test, expect } from "vitest";
import { createMediaCropVideoAdapter } from "./media-crop-video";

describe("Crop Video Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createMediaCropVideoAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("mp4");
  });
  test("validate returns empty", async () => {
    const adapter = createMediaCropVideoAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
