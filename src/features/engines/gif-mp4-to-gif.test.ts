import { describe, test, expect } from "vitest";
import { createGifMp4ToGifAdapter } from "./gif-mp4-to-gif";

describe("MP4 to GIF Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createGifMp4ToGifAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("mp4");
  });
  test("validate returns empty", async () => {
    const adapter = createGifMp4ToGifAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
