import { describe, expect, test, vi } from "vitest";
import { createImageRotateAdapter } from "./image-rotate";

describe("Image Rotate Adapter", () => {
  test("probes decoded JPEG input and validates rotation options", async () => {
    const close = vi.fn();
    const adapter = createImageRotateAdapter({ decode: async () => ({ width: 100, height: 200, close }) as unknown as ImageBitmap });
    const file = new File([Uint8Array.from([0xff, 0xd8, 0xff])], "test.jpg");
    await expect(adapter.probe(file)).resolves.toEqual({ kind: "jpeg", probeRule: "jpeg-soi", bytes: 3, width: 100, height: 200 });
    await expect(adapter.validate([file], { degrees: "90", target: "png" })).resolves.toEqual([]);
    expect(close).toHaveBeenCalledOnce();
  });
});
