export const UNIVERSAL_LIMITS = Object.freeze({
  pdf: { bytes: 500 * 1024 * 1024, pages: 10_000 },
  image: { bytes: 500 * 1024 * 1024, pixels: 1_000_000_000 },
  batch: { files: 10_000, bytes: 2 * 1024 * 1024 * 1024 },
  video: { bytes: 2 * 1024 * 1024 * 1024, durationSeconds: 3600, width: 8192, height: 8192 },
  audio: { bytes: 2 * 1024 * 1024 * 1024, durationSeconds: 3600 },
  gif: { bytes: 500 * 1024 * 1024, durationSeconds: 600, width: 8192, height: 8192 },
  zip: { compressedBytes: 2 * 1024 * 1024 * 1024, expandedBytes: 5 * 1024 * 1024 * 1024, entries: 10_000, depth: 20 },
  ocr: { items: 10_000 },
} as const);