import { describe, expect, test, vi } from "vitest";
import { createImageCropAdapter } from "./image-crop";

describe("Image Crop Adapter", () => {
  test("probes decoded JPEG input and validates crop options", async () => {
    const close = vi.fn();
    const adapter = createImageCropAdapter({ decode: async () => ({ width: 800, height: 600, close }) as unknown as ImageBitmap });
    const file = new File([Uint8Array.from([0xff, 0xd8, 0xff])], "test.jpg");
    await expect(adapter.probe(file)).resolves.toEqual({ kind: "jpeg", probeRule: "jpeg-soi", bytes: 3, width: 800, height: 600 });
    await expect(adapter.validate([file], { cropBox: { x: 10, y: 10, width: 200, height: 150 }, target: "png" })).resolves.toEqual([]);
    expect(close).toHaveBeenCalledOnce();
  });
});
