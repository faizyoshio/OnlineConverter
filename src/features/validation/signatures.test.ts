import { HEADERS } from "@/test/fixtures/headers";
import { detectSignature } from "./signatures";

test.each([
  ["PDF", HEADERS.pdf, "pdf", "pdf-header"],
  ["JPEG", HEADERS.jpeg, "jpeg", "jpeg-soi"],
  ["BMP", HEADERS.bmp, "bmp", "bmp-header"],
  ["WebP", HEADERS.webp, "webp", "webp-riff"],
  ["GIF87a", HEADERS.gif87, "gif", "gif-header"],
  ["GIF89a", HEADERS.gif89, "gif", "gif-header"],
  ["ZIP", HEADERS.zip, "zip", "zip-header"],
  ["WebM", HEADERS.webm, "webm", "webm-ebml"],
  ["AVI", HEADERS.avi, "avi", "avi-riff"],
  ["WAV", HEADERS.wav, "wav", "wav-riff"],
  ["MP3 ID3", HEADERS.mp3Id3, "mp3", "mp3-frame-or-id3"],
  ["MP3 frame", HEADERS.mp3Frame, "mp3", "mp3-frame-or-id3"],
  ["Ogg", HEADERS.ogg, "ogg", "ogg-header"],
  ["AAC", HEADERS.aac, "aac", "aac-adts"],
  ["FLAC", HEADERS.flac, "flac", "flac-header"],
])("detects an exact %s signature", (_label, bytes, kind, probeRule) => {
  expect(detectSignature(bytes)).toEqual({ kind, probeRule, confidence: "exact" });
});

test("returns a PNG candidate because APNG needs chunk inspection", () => {
  expect(detectSignature(HEADERS.png)).toEqual({ kind: "png", probeRule: "png-signature", confidence: "candidate" });
});

test.each([
  ["HEIC", HEADERS.heic, "heic"],
  ["MP4", HEADERS.mp4, "mp4"],
  ["MOV", HEADERS.mov, "mov"],
  ["M4A", HEADERS.m4a, "m4a"],
])("returns an ISO-BMFF candidate for %s", (_label, bytes, kind) => {
  expect(detectSignature(bytes)).toEqual({ kind, probeRule: "iso-bmff-brand", confidence: "candidate" });
});

test.each([HEADERS.html, HEADERS.svg, HEADERS.text])("does not guess text-like inputs from a short header", (bytes) => {
  expect(detectSignature(bytes)).toEqual({ kind: "unknown", probeRule: "unknown", confidence: "none" });
});

test("reads no more than the first 32 bytes", () => {
  const bytes = new Uint8Array(64);
  bytes.set(HEADERS.pdf, 40);
  expect(detectSignature(bytes)).toEqual({ kind: "unknown", probeRule: "unknown", confidence: "none" });
});
