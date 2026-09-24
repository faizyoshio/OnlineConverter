import { describe, expect, test } from "vitest";
import { parseImageCodecCapabilityId, resolveImageEncodeOptions } from "./options";

describe("image codec options", () => {
  test("requires an explicit JPEG conversion target", () => {
    expect(() => resolveImageEncodeOptions("image.jpg-to-modern", {})).toThrow(/target/i);
    expect(resolveImageEncodeOptions("image.jpg-to-modern", { target: "png" })).toEqual({ mimeType: "image/png" });
    expect(resolveImageEncodeOptions("image.jpg-to-modern", { target: "webp" })).toEqual({ mimeType: "image/webp", quality: 0.85 });
  });

  test("normalizes bounded quality percentages", () => {
    expect(resolveImageEncodeOptions("image.webp-to-jpg", { quality: 72 })).toEqual({
      mimeType: "image/jpeg",
      quality: 0.72,
      background: "#ffffff",
    });
    expect(() => resolveImageEncodeOptions("image.webp-to-jpg", { quality: 0 })).toThrow(/between 1 and 100/i);
    expect(() => resolveImageEncodeOptions("image.jpg-to-modern", { target: "webp", webpQuality: 101 })).toThrow(/between 1 and 100/i);
  });

  test("accepts only six-digit alpha background colors", () => {
    expect(resolveImageEncodeOptions("image.webp-to-jpg", { alphaBackground: "#12aBcF" }).background).toBe("#12aBcF");
    expect(() => resolveImageEncodeOptions("image.webp-to-jpg", { alphaBackground: "white" })).toThrow(/hexadecimal/i);
  });

  test("uses lossless PNG output for the fixed PNG capabilities", () => {
    expect(resolveImageEncodeOptions("image.webp-to-png", {})).toEqual({ mimeType: "image/png" });
    expect(resolveImageEncodeOptions("image.jfif-to-png", {})).toEqual({ mimeType: "image/png" });
  });

  test("rejects capability ids outside the reviewed codec set", () => {
    expect(() => parseImageCodecCapabilityId("image.unreviewed")).toThrow(/unknown image capability/i);
  });

  test("resolves compress-jpeg and compress-webp for quality and maxFileSize modes", () => {
    expect(resolveImageEncodeOptions("image.compress-jpeg", { quality: 80 })).toEqual({
      mimeType: "image/jpeg",
      quality: 0.8,
    });
    expect(resolveImageEncodeOptions("image.compress-jpeg", { compressionMode: "maxFileSize", maxFileSizeMb: 300 })).toEqual({
      mimeType: "image/jpeg",
      maxFileSizeMb: 300,
    });
    expect(resolveImageEncodeOptions("image.compress-webp", { compressionMode: "maxFileSize", maxFileSizeMb: 150 })).toEqual({
      mimeType: "image/webp",
      maxFileSizeMb: 150,
    });
  });
});
