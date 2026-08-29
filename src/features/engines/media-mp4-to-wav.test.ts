import { describe, test, expect } from "vitest";
import { createMediaMp4ToWavAdapter } from "./media-mp4-to-wav";

describe("MP4 to WAV Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createMediaMp4ToWavAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("mp4");
  });
  test("validate returns empty", async () => {
    const adapter = createMediaMp4ToWavAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
