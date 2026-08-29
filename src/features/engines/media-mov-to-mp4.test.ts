import { describe, test, expect } from "vitest";
import { createMediaMovToMp4Adapter } from "./media-mov-to-mp4";

describe("MOV to MP4 Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createMediaMovToMp4Adapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("mov");
  });
  test("validate returns empty", async () => {
    const adapter = createMediaMovToMp4Adapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
