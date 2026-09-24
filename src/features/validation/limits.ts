export const UNIVERSAL_LIMITS = Object.freeze({
  pdf: { bytes: 25 * 1024 * 1024, pages: 100 },
  image: { bytes: 20 * 1024 * 1024, pixels: 40_000_000 },
  batch: { files: 10000, bytes: 1000 * 1024 * 1024 },
  video: { bytes: 50 * 1024 * 1024, durationSeconds: 180, width: 1920, height: 1080 },
  audio: { bytes: 50 * 1024 * 1024, durationSeconds: 900 },
  gif: { bytes: 25 * 1024 * 1024, durationSeconds: 30, width: 1280, height: 720 },
  zip: { compressedBytes: 75 * 1024 * 1024, expandedBytes: 200 * 1024 * 1024, entries: 1000, depth: 10 },
  ocr: { items: 20000 },
}) as const;
