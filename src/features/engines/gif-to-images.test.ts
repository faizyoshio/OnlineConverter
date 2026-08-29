import { describe, test, expect } from "vitest";
import { createGifToImagesAdapter } from "./gif-to-images";

describe("GIF to Images Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createGifToImagesAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("gif");
  });
  test("validate returns empty", async () => {
    const adapter = createGifToImagesAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
