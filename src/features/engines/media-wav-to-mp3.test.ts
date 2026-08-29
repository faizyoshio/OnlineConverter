import { describe, test, expect } from "vitest";
import { createMediaWavToMp3Adapter } from "./media-wav-to-mp3";

describe("WAV to MP3 Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createMediaWavToMp3Adapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("wav");
  });
  test("validate returns empty", async () => {
    const adapter = createMediaWavToMp3Adapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
