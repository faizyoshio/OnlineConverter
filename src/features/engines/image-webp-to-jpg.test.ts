import { describe, test, expect } from "vitest";
import { createImageWebpToJpgAdapter } from "./image-webp-to-jpg";

describe("WebP to JPG adapter", () => {
  test("validates JPEG quality and alpha background", async () => {
    const adapter = createImageWebpToJpgAdapter();
    await expect(adapter.validate([], { quality: 85, alphaBackground: "#ffffff" })).resolves.toEqual([]);
    await expect(adapter.validate([], { alphaBackground: "transparent" })).resolves.toEqual([expect.objectContaining({ code: "malformed-input" })]);
  });
});
