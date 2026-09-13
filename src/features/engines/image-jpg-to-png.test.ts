import { describe, expect, test, vi } from "vitest";
import { createImageJpgToPngAdapter } from "./image-jpg-to-png";

describe("JPG to PNG adapter", () => {
  test("probes decoded JPEG input and validates the PNG target", async () => {
    const close = vi.fn();
    const adapter = createImageJpgToPngAdapter({ decode: async () => ({ width: 3, height: 2, close }) as unknown as ImageBitmap });
    const file = new File([Uint8Array.from([0xff, 0xd8, 0xff])], "test.jpg");
    await expect(adapter.probe(file)).resolves.toEqual({ kind: "jpeg", probeRule: "jpeg-soi", bytes: 3, width: 3, height: 2 });
    await expect(adapter.validate([file], { target: "png" })).resolves.toEqual([]);
    expect(close).toHaveBeenCalledOnce();
  });
});
