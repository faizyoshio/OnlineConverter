import { describe, test, expect } from "vitest";
import { createGifAviToGifAdapter } from "./gif-avi-to-gif";

describe("AVI to GIF Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createGifAviToGifAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("avi");
  });
  test("validate returns empty", async () => {
    const adapter = createGifAviToGifAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
