import { describe, test, expect } from "vitest";
import { createGifToApngAdapter } from "./gif-to-apng";

describe("GIF to APNG Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createGifToApngAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("gif");
  });
  test("validate returns empty", async () => {
    const adapter = createGifToApngAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
