import { describe, test, expect } from "vitest";
import { createMediaAacToMp3Adapter } from "./media-aac-to-mp3";

describe("AAC to MP3 Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createMediaAacToMp3Adapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("aac");
  });
  test("validate returns empty", async () => {
    const adapter = createMediaAacToMp3Adapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
