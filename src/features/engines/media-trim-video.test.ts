import { describe, test, expect } from "vitest";
import { createMediaTrimVideoAdapter } from "./media-trim-video";

describe("Trim Video Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createMediaTrimVideoAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("mp4");
  });
  test("validate returns empty", async () => {
    const adapter = createMediaTrimVideoAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
