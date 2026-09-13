import { describe, expect, test, vi } from "vitest";
import { createImageJfifToPngAdapter } from "./image-jfif-to-png";

describe("JFIF to PNG adapter", () => {
  test("treats JFIF as its verified JPEG bitstream", async () => {
    const close = vi.fn();
    const adapter = createImageJfifToPngAdapter({ decode: async () => ({ width: 7, height: 9, close }) as unknown as ImageBitmap });
    const file = new File([Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])], "test.jfif");
    await expect(adapter.probe(file)).resolves.toEqual({ kind: "jpeg", probeRule: "jpeg-soi", bytes: 4, width: 7, height: 9 });
    await expect(adapter.validate([file], {})).resolves.toEqual([]);
    expect(close).toHaveBeenCalledOnce();
  });
});
