import { describe, expect, test, vi } from "vitest";
import { createImageCompressWebpAdapter } from "./image-compress-webp";

describe("Compress WebP Adapter", () => {
  test("probes decoded WebP input and validates compression options", async () => {
    const close = vi.fn();
    const adapter = createImageCompressWebpAdapter({ decode: async () => ({ width: 400, height: 300, close }) as unknown as ImageBitmap });
    const file = new File([Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])], "test.webp");
    await expect(adapter.probe(file)).resolves.toEqual({ kind: "webp", probeRule: "webp-riff", bytes: 12, width: 400, height: 300 });
    await expect(adapter.validate([file], { quality: 80, preserveAlpha: true })).resolves.toEqual([]);
    expect(close).toHaveBeenCalledOnce();
  });
});
