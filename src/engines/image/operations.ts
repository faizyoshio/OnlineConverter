/**
 * Browser-first Image operations using Canvas and typed-array inspection.
 * Functions operate on ImageData, Canvas, or raw byte buffers.
 */

import "client-only";

export interface ColorPickResult {
  hex: string;
  rgb: string;
  hsl: string;
}

export interface ExtractedColor {
  hex: string;
  proportion: number;
}

export function pickColorFromImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
): ColorPickResult {
  const clampedX = Math.max(0, Math.min(width - 1, Math.floor(x)));
  const clampedY = Math.max(0, Math.min(height - 1, Math.floor(y)));
  const offset = (clampedY * width + clampedX) * 4;

  const r = data[offset] ?? 0;
  const g = data[offset + 1] ?? 0;
  const b = data[offset + 2] ?? 0;

  const hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  const rgbStr = `${r} ${g} ${b}`;

  // RGB to HSL
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  const hslStr = `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;

  return { hex, rgb: rgbStr, hsl: hslStr };
}

export function extractPaletteFromImageData(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  maxColors: number = 5,
): ExtractedColor[] {
  const totalPixels = width * height;
  if (totalPixels === 0) return [];

  // Quantize colors into 32-level bins (5 bits per channel)
  const bins = new Map<string, { count: number; r: number; g: number; b: number }>();
  const step = Math.max(1, Math.floor(totalPixels / 10000)); // sample max 10k pixels

  let sampledCount = 0;
  for (let i = 0; i < totalPixels; i += step) {
    const offset = i * 4;
    const r = data[offset] ?? 0;
    const g = data[offset + 1] ?? 0;
    const b = data[offset + 2] ?? 0;
    const a = data[offset + 3] ?? 255;

    // Skip transparent pixels
    if (a < 128) continue;

    // 5-bit quantization
    const qr = Math.floor(r / 8) * 8;
    const qg = Math.floor(g / 8) * 8;
    const qb = Math.floor(b / 8) * 8;
    const key = `${qr},${qg},${qb}`;

    const existing = bins.get(key);
    if (existing) {
      existing.count++;
    } else {
      bins.set(key, { count: 1, r: qr, g: qg, b: qb });
    }
    sampledCount++;
  }

  if (sampledCount === 0) return [];

  // Sort by frequency
  const sorted = Array.from(bins.values()).sort((a, b) => b.count - a.count);
  const topColors = sorted.slice(0, maxColors);

  return topColors.map((c) => ({
    hex: `#${c.r.toString(16).padStart(2, "0")}${c.g.toString(16).padStart(2, "0")}${c.b.toString(16).padStart(2, "0")}`,
    proportion: Number((c.count / sampledCount).toFixed(4)),
  }));
}

export function stripJpegExif(jpegBytes: Uint8Array): Uint8Array {
  // JPEG starts with SOI (0xFFD8)
  if (jpegBytes.length < 4 || jpegBytes[0] !== 0xff || jpegBytes[1] !== 0xd8) {
    return jpegBytes; // Not a JPEG
  }

  const result: number[] = [0xff, 0xd8];
  let offset = 2;

  while (offset < jpegBytes.length) {
    if (jpegBytes[offset] !== 0xff) break;

    const marker = jpegBytes[offset + 1]!;
    // SOS (Start of Scan) - rest is image data
    if (marker === 0xda) {
      for (let i = offset; i < jpegBytes.length; i++) {
        result.push(jpegBytes[i]!);
      }
      break;
    }

    // Read segment length (big-endian)
    if (offset + 3 >= jpegBytes.length) break;
    const length = (jpegBytes[offset + 2]! << 8) | jpegBytes[offset + 3]!;

    // APP1 marker (0xFFE1) is typically EXIF - skip it
    // APP2 marker (0xFFE2) can be ICC profile or FlashPix - also skip if EXIF-related
    const isExif = marker === 0xe1;

    if (!isExif) {
      for (let i = offset; i < offset + 2 + length && i < jpegBytes.length; i++) {
        result.push(jpegBytes[i]!);
      }
    }

    offset += 2 + length;
  }

  return new Uint8Array(result);
}

export function calculateAspectRatioFit(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (srcWidth <= 0 || srcHeight <= 0) return { width: 1, height: 1 };
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return {
    width: Math.max(1, Math.round(srcWidth * ratio)),
    height: Math.max(1, Math.round(srcHeight * ratio)),
  };
}
