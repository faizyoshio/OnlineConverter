import { describe, test, expect } from "vitest";
import { createGifVideoToGifAdapter } from "./gif-video-to-gif";

describe("Video to GIF Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createGifVideoToGifAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("mp4");
  });
  test("validate returns empty", async () => {
    const adapter = createGifVideoToGifAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
