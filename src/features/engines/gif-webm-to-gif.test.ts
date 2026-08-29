import { describe, test, expect } from "vitest";
import { createGifWebmToGifAdapter } from "./gif-webm-to-gif";

describe("WebM to GIF Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createGifWebmToGifAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("webm");
  });
  test("validate returns empty", async () => {
    const adapter = createGifWebmToGifAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
