import { describe, test, expect } from "vitest";
import { createGifToMp4Adapter } from "./gif-to-mp4";

describe("GIF to MP4 Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createGifToMp4Adapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("gif");
  });
  test("validate returns empty", async () => {
    const adapter = createGifToMp4Adapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
