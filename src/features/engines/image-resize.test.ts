import { describe, expect, test, vi } from "vitest";
import { createImageResizeAdapter } from "./image-resize";

describe("Image Resize Adapter", () => {
  test("probes decoded JPEG input and validates resize options", async () => {
    const close = vi.fn();
    const adapter = createImageResizeAdapter({ decode: async () => ({ width: 800, height: 600, close }) as unknown as ImageBitmap });
    const file = new File([Uint8Array.from([0xff, 0xd8, 0xff])], "test.jpg");
    await expect(adapter.probe(file)).resolves.toEqual({ kind: "jpeg", probeRule: "jpeg-soi", bytes: 3, width: 800, height: 600 });
    await expect(adapter.validate([file], { width: 400, height: 300, target: "png" })).resolves.toEqual([]);
    expect(close).toHaveBeenCalledOnce();
  });
});
