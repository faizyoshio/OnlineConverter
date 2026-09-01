import "client-only";
import { toCanvas, toSVG } from "@bwip-js/browser";

export type BarcodeFormat =
  | "code-128"
  | "code-39"
  | "ean-13"
  | "ean-8"
  | "upc-a"
  | "itf-14"
  | "codabar"
  | "qr";

export type BarcodeRenderOptions = {
  format: BarcodeFormat;
  text: string;
  quietZonePx: number;
};

type BarcodeEncoder = "code128" | "code39" | "ean13" | "ean8" | "upca" | "itf14" | "rationalizedCodabar" | "qrcode";

const ENCODERS: Readonly<Record<BarcodeFormat, BarcodeEncoder>> = Object.freeze({
  "code-128": "code128",
  "code-39": "code39",
  "ean-13": "ean13",
  "ean-8": "ean8",
  "upc-a": "upca",
  "itf-14": "itf14",
  codabar: "rationalizedCodabar",
  qr: "qrcode",
});

export function barcodeEncoder(format: BarcodeFormat): BarcodeEncoder {
  const encoder = ENCODERS[format];
  if (!encoder) throw new Error(`Unsupported barcode format: ${format}`);
  return encoder;
}

function hasValidGs1Checksum(value: string): boolean {
  if (!/^\d+$/.test(value) || value.length < 2) return false;
  const digits = [...value].map(Number);
  const supplied = digits.pop()!;
  const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return supplied === (10 - (sum % 10)) % 10;
}

function validateText(format: BarcodeFormat, text: string): void {
  const length = [...text].length;
  if (length === 0) throw new Error("Barcode text is required");
  if (length > 2_048) throw new Error("Barcode text cannot exceed 2,048 characters");

  switch (format) {
    case "code-128":
      if (!/^[\x20-\x7e]+$/.test(text)) throw new Error("Code 128 accepts printable ASCII text");
      break;
    case "code-39":
      if (!/^[0-9A-Z .$/+%-]+$/.test(text)) throw new Error("Code 39 accepts uppercase standard characters only");
      break;
    case "ean-13":
      if (text.length !== 13 || !hasValidGs1Checksum(text)) throw new Error("EAN-13 requires 13 digits with a valid checksum");
      break;
    case "ean-8":
      if (text.length !== 8 || !hasValidGs1Checksum(text)) throw new Error("EAN-8 requires 8 digits with a valid checksum");
      break;
    case "upc-a":
      if (text.length !== 12 || !hasValidGs1Checksum(text)) throw new Error("UPC-A requires 12 digits with a valid checksum");
      break;
    case "itf-14":
      if (text.length !== 14 || !hasValidGs1Checksum(text)) throw new Error("ITF-14 requires 14 digits with a valid checksum");
      break;
    case "codabar":
      if (!/^[A-D][0-9\-$:/.+]+[A-D]$/.test(text)) throw new Error("Codabar requires A-D start and stop characters with a valid interior value");
      break;
    case "qr":
      break;
  }
}

function addIntrinsicDimensions(svg: string): string {
  const viewBox = /^<svg\b[^>]*\bviewBox="([^"]+)"/.exec(svg)?.[1];
  const values = viewBox?.trim().split(/\s+/).map(Number);
  if (!values || values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    throw new Error("Barcode SVG has an invalid view box");
  }
  const width = values[2]! - values[0]!;
  const height = values[3]! - values[1]!;
  if (width <= 0 || height <= 0) throw new Error("Barcode SVG has invalid dimensions");
  return svg.replace(/^<svg\b/, `<svg width="${width}" height="${height}"`);
}

function encoderOptions(options: BarcodeRenderOptions) {
  const { format, text, quietZonePx } = options;
  if (!Number.isInteger(quietZonePx) || quietZonePx < 0 || quietZonePx > 100) {
    throw new Error("Barcode quiet zone must be between 0 and 100 pixels");
  }
  validateText(format, text);
  const bcid = barcodeEncoder(format);
  return {
    bcid,
    text,
    scale: 2,
    paddingwidth: quietZonePx,
    paddingheight: quietZonePx,
    ...(format === "qr" ? {} : { height: 12, includetext: true, textxalign: "center" as const }),
  };
}

export async function generateBarcodeSvg(options: BarcodeRenderOptions): Promise<string> {
  return addIntrinsicDimensions(toSVG(encoderOptions(options)));
}

export async function generateBarcodePng(options: BarcodeRenderOptions): Promise<Blob> {
  const renderOptions = encoderOptions(options);
  if (typeof OffscreenCanvas === "undefined") throw new Error("OffscreenCanvas is unavailable for PNG barcode rendering");
  const canvas = new OffscreenCanvas(1, 1);
  toCanvas(canvas, renderOptions);
  return canvas.convertToBlob({ type: "image/png" });
}
