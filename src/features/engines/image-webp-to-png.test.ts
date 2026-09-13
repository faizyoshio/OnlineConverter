import { describe, expect, test, vi } from "vitest";
import { createImageWebpToPngAdapter } from "./image-webp-to-png";

describe("WebP to PNG adapter", () => {
  test("probes decoded WebP input", async () => {
    const close = vi.fn();
    const adapter = createImageWebpToPngAdapter({ decode: async () => ({ width: 4, height: 5, close }) as unknown as ImageBitmap });
    const bytes = Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    await expect(adapter.probe(new File([bytes], "test.webp"))).resolves.toEqual({ kind: "webp", probeRule: "webp-riff", bytes: 12, width: 4, height: 5 });
    expect(close).toHaveBeenCalledOnce();
  });
});
