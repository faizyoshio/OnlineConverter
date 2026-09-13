import { describe, expect, test, vi } from "vitest";
import { createImageFlipAdapter } from "./image-flip";

describe("Image Flip Adapter", () => {
  test("probes decoded JPEG input and validates flip options", async () => {
    const close = vi.fn();
    const adapter = createImageFlipAdapter({ decode: async () => ({ width: 150, height: 250, close }) as unknown as ImageBitmap });
    const file = new File([Uint8Array.from([0xff, 0xd8, 0xff])], "test.jpg");
    await expect(adapter.probe(file)).resolves.toEqual({ kind: "jpeg", probeRule: "jpeg-soi", bytes: 3, width: 150, height: 250 });
    await expect(adapter.validate([file], { direction: "vertical", target: "png" })).resolves.toEqual([]);
    expect(close).toHaveBeenCalledOnce();
  });
});
