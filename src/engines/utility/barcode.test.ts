import { describe, expect, test } from "vitest";
import { barcodeEncoder, generateBarcodeSvg, type BarcodeFormat } from "./barcode";

const mappings: readonly [BarcodeFormat, string][] = [
  ["code-128", "code128"],
  ["code-39", "code39"],
  ["ean-13", "ean13"],
  ["ean-8", "ean8"],
  ["upc-a", "upca"],
  ["itf-14", "itf14"],
  ["codabar", "rationalizedCodabar"],
  ["qr", "qrcode"],
];

describe("barcode generation", () => {
  test.each(mappings)("maps %s to the reviewed browser encoder", (format, encoder) => {
    expect(barcodeEncoder(format)).toBe(encoder);
  });

  test.each([
    ["code-128", "ABC-123"],
    ["code-39", "ABC-123"],
    ["ean-13", "5901234123457"],
    ["ean-8", "55123457"],
    ["upc-a", "036000291452"],
    ["itf-14", "10012345000017"],
    ["codabar", "A12345B"],
    ["qr", "https://example.com"],
  ] as const)("creates a self-contained %s SVG", async (format, text) => {
    const svg = await generateBarcodeSvg({ format, text, quietZonePx: 10 });
    expect(svg).toMatch(/^<svg\b/);
    expect(svg).toContain("viewBox=");
    expect(svg).not.toMatch(/<script\b|(?:href|src)=["']https?:/i);
  });

  test("rejects invalid checksums, character sets, and option bounds", async () => {
    await expect(generateBarcodeSvg({ format: "ean-13", text: "5901234123458", quietZonePx: 10 })).rejects.toThrow("checksum");
    await expect(generateBarcodeSvg({ format: "code-39", text: "lowercase", quietZonePx: 10 })).rejects.toThrow("Code 39");
    await expect(generateBarcodeSvg({ format: "codabar", text: "12345", quietZonePx: 10 })).rejects.toThrow("Codabar");
    await expect(generateBarcodeSvg({ format: "qr", text: "", quietZonePx: 10 })).rejects.toThrow("required");
    await expect(generateBarcodeSvg({ format: "qr", text: "x".repeat(2_049), quietZonePx: 10 })).rejects.toThrow("2,048");
    await expect(generateBarcodeSvg({ format: "qr", text: "ok", quietZonePx: 101 })).rejects.toThrow("quiet zone");
  });
});
