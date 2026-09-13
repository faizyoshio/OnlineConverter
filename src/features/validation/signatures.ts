import type { FileKind } from "@/features/capabilities/schema";
import type { SignatureDetection } from "./types";

const MAX_SIGNATURE_BYTES = 32;

function startsWith(bytes: Uint8Array, expected: readonly number[]): boolean {
  return expected.every((value, index) => bytes[index] === value);
}

function ascii(value: string): readonly number[] {
  return Array.from(value, (character) => character.charCodeAt(0));
}

function exact(kind: FileKind, probeRule: SignatureDetection["probeRule"]): SignatureDetection {
  return { kind, probeRule, confidence: "exact" };
}

function candidate(kind: FileKind, probeRule: SignatureDetection["probeRule"]): SignatureDetection {
  return { kind, probeRule, confidence: "candidate" };
}

function detectIsoBrand(bytes: Uint8Array): SignatureDetection | undefined {
  if (!startsWith(bytes.subarray(4), ascii("ftyp")) || bytes.length < 12) return undefined;
  const brand = String.fromCharCode(...bytes.subarray(8, 12)).trim().toLowerCase();
  if (["heic", "heix", "hevc", "hevx", "mif1", "msf1"].includes(brand)) return candidate("heic", "iso-bmff-brand");
  if (["isom", "iso2", "mp41", "mp42", "avc1"].includes(brand)) return candidate("mp4", "iso-bmff-brand");
  if (brand === "qt") return candidate("mov", "iso-bmff-brand");
  if (brand === "m4a" || brand === "m4b") return candidate("m4a", "iso-bmff-brand");
  return { kind: "unknown", probeRule: "iso-bmff-brand", confidence: "candidate" };
}

export function detectSignature(input: Uint8Array, fileName?: string): SignatureDetection {
  const bytes = input.subarray(0, MAX_SIGNATURE_BYTES);
  if (startsWith(bytes, ascii("%PDF-"))) return exact("pdf", "pdf-header");
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return exact("jpeg", "jpeg-soi");
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return candidate("png", "png-signature");
  if (startsWith(bytes, ascii("BM"))) return exact("bmp", "bmp-header");
  if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes.subarray(8), ascii("WEBP"))) return exact("webp", "webp-riff");
  if (startsWith(bytes, ascii("GIF87a")) || startsWith(bytes, ascii("GIF89a"))) return exact("gif", "gif-header");
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) || startsWith(bytes, [0x50, 0x4b, 0x05, 0x06])) {
    if (fileName) {
      const lower = fileName.toLowerCase();
      if (lower.endsWith(".docx") || lower.endsWith(".doc")) return exact("docx", "zip-header");
      if (lower.endsWith(".pptx") || lower.endsWith(".ppt")) return exact("pptx", "zip-header");
      if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return exact("xlsx", "zip-header");
    }
    return exact("zip", "zip-header");
  }

  const isoDetection = detectIsoBrand(bytes);
  if (isoDetection) return isoDetection;

  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return exact("webm", "webm-ebml");
  if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes.subarray(8), ascii("AVI "))) return exact("avi", "avi-riff");
  if (startsWith(bytes, ascii("RIFF")) && startsWith(bytes.subarray(8), ascii("WAVE"))) return exact("wav", "wav-riff");
  if (startsWith(bytes, ascii("ID3"))) return exact("mp3", "mp3-frame-or-id3");
  if (bytes[0] === 0xff && bytes[1] !== undefined && (bytes[1] & 0xf6) === 0xf0) return exact("aac", "aac-adts");
  if (bytes[0] === 0xff && bytes[1] !== undefined && (bytes[1] & 0xe0) === 0xe0 && (bytes[1] & 0x06) !== 0) {
    return exact("mp3", "mp3-frame-or-id3");
  }
  if (startsWith(bytes, ascii("OggS"))) return exact("ogg", "ogg-header");
  if (startsWith(bytes, ascii("fLaC"))) return exact("flac", "flac-header");
  return { kind: "unknown", probeRule: "unknown", confidence: "none" };
}
