import { capabilityRegistry } from "@/features/capabilities";
import { UNIVERSAL_LIMITS } from "./limits";
import { validateBatch, validateProbe } from "./validate";
import type { FileProbe } from "./types";

function manifest(id: string) {
  const value = capabilityRegistry.find((item) => item.id === id);
  expect(value).toBeDefined();
  return value!;
}

function expectAtLimit(id: string, probe: FileProbe) {
  expect(validateProbe(probe, manifest(id))).toEqual([]);
}

function expectOverLimit(id: string, probe: FileProbe, field: string) {
  expect(validateProbe(probe, manifest(id))).toEqual(
    expect.arrayContaining([expect.objectContaining({ code: "limit-exceeded", field })]),
  );
}

test("enforces PDF byte and page boundaries", () => {
  expectAtLimit("pdf.merge", { kind: "pdf", probeRule: "pdf-header", bytes: UNIVERSAL_LIMITS.pdf.bytes, pages: UNIVERSAL_LIMITS.pdf.pages });
  expectOverLimit("pdf.merge", { kind: "pdf", probeRule: "pdf-header", bytes: UNIVERSAL_LIMITS.pdf.bytes + 1, pages: UNIVERSAL_LIMITS.pdf.pages }, "bytes");
  expectOverLimit("pdf.merge", { kind: "pdf", probeRule: "pdf-header", bytes: 1, pages: UNIVERSAL_LIMITS.pdf.pages + 1 }, "pages");
});

test("enforces image byte and pixel boundaries", () => {
  expectAtLimit("image.compress-png", { kind: "png", probeRule: "png-signature", bytes: UNIVERSAL_LIMITS.image.bytes, width: 8000, height: 5000 });
  expectOverLimit("image.compress-png", { kind: "png", probeRule: "png-signature", bytes: UNIVERSAL_LIMITS.image.bytes + 1, width: 1, height: 1 }, "bytes");
  expectOverLimit("image.compress-png", { kind: "png", probeRule: "png-signature", bytes: 1, width: UNIVERSAL_LIMITS.image.pixels + 1, height: 1 }, "pixels");
});

test("enforces batch count and aggregate byte boundaries", () => {
  const atLimit = Array.from({ length: UNIVERSAL_LIMITS.batch.files }, () => ({ size: UNIVERSAL_LIMITS.batch.bytes / UNIVERSAL_LIMITS.batch.files }));
  expect(validateBatch(atLimit)).toEqual([]);
  expect(validateBatch([...atLimit, { size: 0 }])).toEqual(expect.arrayContaining([expect.objectContaining({ field: "files", limit: 20 })]));
  expect(validateBatch([{ size: UNIVERSAL_LIMITS.batch.bytes + 1 }])).toEqual(expect.arrayContaining([expect.objectContaining({ field: "batchBytes" })]));
});

test("enforces GIF byte, duration, and dimension boundaries", () => {
  const base = { kind: "gif" as const, probeRule: "gif-header" as const, bytes: UNIVERSAL_LIMITS.gif.bytes, durationSeconds: 30, width: 1280, height: 720 };
  expectAtLimit("gif.compress", base);
  expectOverLimit("gif.compress", { ...base, bytes: base.bytes + 1 }, "bytes");
  expectOverLimit("gif.compress", { ...base, durationSeconds: 31 }, "durationSeconds");
  expectOverLimit("gif.compress", { ...base, width: 1281 }, "width");
  expectOverLimit("gif.compress", { ...base, height: 721 }, "height");
});

test("enforces ZIP compressed, expanded, entry, and depth boundaries", () => {
  const base = { kind: "zip" as const, probeRule: "zip-header" as const, bytes: UNIVERSAL_LIMITS.zip.compressedBytes, expandedBytes: UNIVERSAL_LIMITS.zip.expandedBytes, archiveEntries: 1000, archiveDepth: 10 };
  expectAtLimit("archive.zip-extract", base);
  expectOverLimit("archive.zip-extract", { ...base, bytes: base.bytes + 1 }, "compressedBytes");
  expectOverLimit("archive.zip-extract", { ...base, expandedBytes: base.expandedBytes + 1 }, "expandedBytes");
  expectOverLimit("archive.zip-extract", { ...base, archiveEntries: 1001 }, "archiveEntries");
  expectOverLimit("archive.zip-extract", { ...base, archiveDepth: 11 }, "archiveDepth");
});

test("enforces OCR item boundaries", () => {
  expectAtLimit("pdf.ocr", { kind: "pdf", probeRule: "pdf-header", bytes: 1, pages: UNIVERSAL_LIMITS.ocr.items });
  expectOverLimit("pdf.ocr", { kind: "pdf", probeRule: "pdf-header", bytes: 1, pages: UNIVERSAL_LIMITS.ocr.items + 1 }, "ocrItems");
});
