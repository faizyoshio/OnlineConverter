import { describe, test, expect } from "vitest";
import { createMediaMp4ToMp3Adapter } from "./media-mp4-to-mp3";

describe("MP4 to MP3 Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createMediaMp4ToMp3Adapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("mp4");
  });
  test("validate returns empty", async () => {
    const adapter = createMediaMp4ToMp3Adapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
