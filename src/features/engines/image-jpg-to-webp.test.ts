import { describe, test, expect } from "vitest";
import { createImageJpgToWebpAdapter } from "./image-jpg-to-webp";

describe("JPG to WebP adapter", () => {
  test("validates the WebP target and bounded quality", async () => {
    const adapter = createImageJpgToWebpAdapter();
    await expect(adapter.validate([], { target: "webp", webpQuality: 80 })).resolves.toEqual([]);
    await expect(adapter.validate([], { target: "webp", webpQuality: 0 })).resolves.toEqual([expect.objectContaining({ code: "malformed-input" })]);
  });
});
