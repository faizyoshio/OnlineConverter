import { describe, expect, test, vi } from "vitest";
import { createImageCircleCropAdapter } from "./image-circle-crop";

describe("Image Circle Crop Adapter", () => {
  test("probes decoded JPEG input and validates circle crop options", async () => {
    const close = vi.fn();
    const adapter = createImageCircleCropAdapter({ decode: async () => ({ width: 300, height: 300, close }) as unknown as ImageBitmap });
    const file = new File([Uint8Array.from([0xff, 0xd8, 0xff])], "test.jpg");
    await expect(adapter.probe(file)).resolves.toEqual({ kind: "jpeg", probeRule: "jpeg-soi", bytes: 3, width: 300, height: 300 });
    await expect(adapter.validate([file], { target: "png", crop: "centered-square" })).resolves.toEqual([]);
    expect(close).toHaveBeenCalledOnce();
  });
});
