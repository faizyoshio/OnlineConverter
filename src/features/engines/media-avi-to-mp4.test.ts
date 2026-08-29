import { describe, test, expect } from "vitest";
import { createMediaAviToMp4Adapter } from "./media-avi-to-mp4";

describe("AVI to MP4 Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createMediaAviToMp4Adapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("avi");
  });
  test("validate returns empty", async () => {
    const adapter = createMediaAviToMp4Adapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
