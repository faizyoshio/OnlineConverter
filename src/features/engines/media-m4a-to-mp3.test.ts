import { describe, test, expect } from "vitest";
import { createMediaM4aToMp3Adapter } from "./media-m4a-to-mp3";

describe("M4A to MP3 Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createMediaM4aToMp3Adapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("m4a");
  });
  test("validate returns empty", async () => {
    const adapter = createMediaM4aToMp3Adapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
