import { describe, test, expect } from "vitest";
import { createMediaWebmToMp4Adapter } from "./media-webm-to-mp4";

describe("WebM to MP4 Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createMediaWebmToMp4Adapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("webm");
  });
  test("validate returns empty", async () => {
    const adapter = createMediaWebmToMp4Adapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
