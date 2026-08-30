import { describe, test, expect } from "vitest";
import {
  pickColorFromImageData,
  extractPaletteFromImageData,
  stripJpegExif,
  calculateAspectRatioFit,
} from "./operations";

describe("Image Operations Engine", () => {
  test("pickColorFromImageData returns hex, rgb, and hsl for white pixel", () => {
    // 2x2 image, top-left is white (255, 255, 255, 255)
    const data = new Uint8ClampedArray([
      255, 255, 255, 255,  0, 0, 0, 255,
      0, 0, 0, 255,        0, 0, 0, 255,
    ]);

    const result = pickColorFromImageData(data, 2, 2, 0, 0);
    expect(result.hex).toBe("#ffffff");
    expect(result.rgb).toBe("255 255 255");
    expect(result.hsl).toBe("0 0% 100%");
  });

  test("pickColorFromImageData returns correct values for red pixel", () => {
    const data = new Uint8ClampedArray([255, 0, 0, 255]);
    const result = pickColorFromImageData(data, 1, 1, 0, 0);
    expect(result.hex).toBe("#ff0000");
    expect(result.rgb).toBe("255 0 0");
    expect(result.hsl).toBe("0 100% 50%");
  });

  test("extractPaletteFromImageData extracts top colors with proportions", () => {
    // 4 pixels: 3 red, 1 blue
    const data = new Uint8ClampedArray([
      255, 0, 0, 255,
      255, 0, 0, 255,
      255, 0, 0, 255,
      0, 0, 255, 255,
    ]);

    const palette = extractPaletteFromImageData(data, 2, 2, 5);
    expect(palette.length).toBe(2);
    expect(palette[0]!.proportion).toBeGreaterThan(palette[1]!.proportion);
  });

  test("stripJpegExif removes APP1 EXIF segment", () => {
    // Construct minimal JPEG with APP1 EXIF segment
    const app1Data = [0x45, 0x78, 0x69, 0x66]; // "Exif"
    const app1Length = app1Data.length + 2;
    const jpegWithExif = new Uint8Array([
      0xff, 0xd8, // SOI
      0xff, 0xe1, (app1Length >> 8) & 0xff, app1Length & 0xff, ...app1Data, // APP1 EXIF
      0xff, 0xda, 0x00, 0x02, 0x00, 0x00, // SOS + payload
    ]);

    const stripped = stripJpegExif(jpegWithExif);
    expect(stripped.length).toBeLessThan(jpegWithExif.length);
    // Check that 0xFFE1 is gone
    let hasApp1 = false;
    for (let i = 0; i < stripped.length - 1; i++) {
      if (stripped[i] === 0xff && stripped[i + 1] === 0xe1) hasApp1 = true;
    }
    expect(hasApp1).toBe(false);
  });

  test("calculateAspectRatioFit preserves aspect ratio", () => {
    const fit1 = calculateAspectRatioFit(1920, 1080, 800, 600);
    expect(fit1.width).toBe(800);
    expect(fit1.height).toBe(450);

    const fit2 = calculateAspectRatioFit(500, 1000, 800, 600);
    expect(fit2.width).toBe(300);
    expect(fit2.height).toBe(600);
  });
});
