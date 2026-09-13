import { describe, expect, test, vi } from "vitest";
import { probeRasterImage } from "./probe";

function bitmap(width: number, height: number, close = vi.fn()): ImageBitmap {
  return { width, height, close } as unknown as ImageBitmap;
}

describe("raster image probe", () => {
  test.each([
    [Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]), "jpeg", "jpeg-soi"],
    [Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]), "webp", "webp-riff"],
  ])("verifies the signature and decoded dimensions", async (bytes, kind, probeRule) => {
    const close = vi.fn();
    const decode = vi.fn(async () => bitmap(640, 480, close));
    const file = new File([bytes], "input.bin");

    await expect(probeRasterImage(file, decode)).resolves.toEqual({ kind, probeRule, bytes: file.size, width: 640, height: 480 });
    expect(decode).toHaveBeenCalledWith(file);
    expect(close).toHaveBeenCalledOnce();
  });

  test("does not decode unsupported signatures", async () => {
    const decode = vi.fn(async () => bitmap(1, 1));
    await expect(probeRasterImage(new File(["not-an-image"], "input.bin"), decode)).resolves.toEqual({ kind: "unknown", probeRule: "unknown", bytes: 0 });
    expect(decode).not.toHaveBeenCalled();
  });

  test("rejects a signature-valid file that the browser cannot decode", async () => {
    const file = new File([Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])], "broken.jpg");
    await expect(probeRasterImage(file, async () => { throw new Error("decode failed"); })).resolves.toEqual({ kind: "unknown", probeRule: "unknown", bytes: 0 });
  });

  test("closes decoded bitmaps even when dimensions are invalid", async () => {
    const close = vi.fn();
    await expect(probeRasterImage(
      new File([Uint8Array.from([0xff, 0xd8, 0xff])], "bad.jpg"),
      async () => bitmap(0, 10, close),
    )).resolves.toEqual({ kind: "unknown", probeRule: "unknown", bytes: 0 });
    expect(close).toHaveBeenCalledOnce();
  });
});
