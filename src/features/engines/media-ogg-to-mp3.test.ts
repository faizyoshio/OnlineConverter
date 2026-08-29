import { describe, test, expect } from "vitest";
import { createMediaOggToMp3Adapter } from "./media-ogg-to-mp3";

describe("OGG to MP3 Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createMediaOggToMp3Adapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("ogg");
  });
  test("validate returns empty", async () => {
    const adapter = createMediaOggToMp3Adapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
