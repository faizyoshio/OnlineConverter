import { describe, test, expect } from "vitest";
import { createMediaFlacToMp3Adapter } from "./media-flac-to-mp3";

describe("FLAC to MP3 Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createMediaFlacToMp3Adapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("flac");
  });
  test("validate returns empty", async () => {
    const adapter = createMediaFlacToMp3Adapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
