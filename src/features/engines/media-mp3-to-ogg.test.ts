import { describe, test, expect } from "vitest";
import { createMediaMp3ToOggAdapter } from "./media-mp3-to-ogg";

describe("MP3 to OGG Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createMediaMp3ToOggAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("mp3");
  });
  test("validate returns empty", async () => {
    const adapter = createMediaMp3ToOggAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
