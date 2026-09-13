import { describe, expect, test, vi } from "vitest";
import { createImageCompressJpgAdapter } from "./image-compress-jpg";

describe("Compress JPG Adapter", () => {
  test("probes decoded JPEG input and validates compression options", async () => {
    const close = vi.fn();
    const adapter = createImageCompressJpgAdapter({ decode: async () => ({ width: 400, height: 300, close }) as unknown as ImageBitmap });
    const file = new File([Uint8Array.from([0xff, 0xd8, 0xff])], "test.jpg");
    await expect(adapter.probe(file)).resolves.toEqual({ kind: "jpeg", probeRule: "jpeg-soi", bytes: 3, width: 400, height: 300 });
    await expect(adapter.validate([file], { quality: 80, stripMetadata: true })).resolves.toEqual([]);
    expect(close).toHaveBeenCalledOnce();
  });
});
