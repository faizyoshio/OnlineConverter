import { describe, test, expect } from "vitest";
import { createGifApngToGifAdapter } from "./gif-apng-to-gif";

describe("APNG to GIF Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createGifApngToGifAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("apng");
  });
  test("validate returns empty", async () => {
    const adapter = createGifApngToGifAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
