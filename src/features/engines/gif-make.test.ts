import { describe, test, expect } from "vitest";
import { createGifMakeAdapter } from "./gif-make";

describe("GIF Maker Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createGifMakeAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("png");
  });
  test("validate returns empty", async () => {
    const adapter = createGifMakeAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
