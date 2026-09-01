import { describe, expect, test, vi } from "vitest";
import type { LocalWorkerOperationContext } from "@/features/workers/local-runtime";
import { processImageOperation, type ImageOperationDependencies } from "./worker-operation";

function context(overrides: Partial<LocalWorkerOperationContext> = {}): LocalWorkerOperationContext {
  return {
    capabilityId: "image.jpg-to-modern",
    jobId: "image-job",
    inputs: [new File([new Uint8Array([0xff, 0xd8, 0xff])], "source.jpg", { type: "image/jpeg" })],
    options: { target: "png", webpQuality: 85 },
    isCancelled: () => false,
    reportProgress: () => undefined,
    ...overrides,
  };
}

function dependencies(outputType = "image/png", width = 4, height = 3) {
  const close = vi.fn();
  const fillRect = vi.fn();
  const drawImage = vi.fn();
  const convertToBlob = vi.fn(async () => new Blob([new Uint8Array([1, 2, 3])], { type: outputType }));
  const deps: ImageOperationDependencies = {
    decode: vi.fn(async () => ({ width, height, close } as unknown as ImageBitmap)),
    createCanvas: vi.fn(() => ({
      getContext: () => ({ fillStyle: "", fillRect, drawImage }),
      convertToBlob,
    } as unknown as OffscreenCanvas)),
  };
  return { deps, close, fillRect, drawImage, convertToBlob };
}

describe("image worker operation", () => {
  test("encodes JPEG input as PNG or WebP and closes the bitmap", async () => {
    const pngHarness = dependencies("image/png");
    const png = await processImageOperation(context(), pngHarness.deps);
    expect(png.mode).toBe("files");
    if (png.mode !== "files") throw new Error("Expected files result");
    expect(png.metadata).toEqual({ resultMode: "files", outputMimeTypes: ["image/png"], outputBytes: [3] });
    expect(pngHarness.drawImage).toHaveBeenCalledTimes(1);
    expect(pngHarness.close).toHaveBeenCalledTimes(1);

    const webpHarness = dependencies("image/webp");
    await processImageOperation(context({ options: { target: "webp", webpQuality: 85 } }), webpHarness.deps);
    expect(webpHarness.convertToBlob).toHaveBeenCalledWith({ type: "image/webp", quality: 0.85 });
    expect(webpHarness.close).toHaveBeenCalledTimes(1);
  });

  test("paints the selected background before WebP to JPEG encoding", async () => {
    const harness = dependencies("image/jpeg");
    await processImageOperation(context({
      capabilityId: "image.webp-to-jpg",
      options: { alphaBackground: "#ffffff", quality: 85 },
    }), harness.deps);
    expect(harness.fillRect).toHaveBeenCalledWith(0, 0, 4, 3);
    expect(harness.convertToBlob).toHaveBeenCalledWith({ type: "image/jpeg", quality: 0.85 });
  });

  test.each([
    ["image.webp-to-png", "image/png"],
    ["image.jfif-to-png", "image/png"],
  ])("encodes %s with the declared MIME", async (capabilityId, mimeType) => {
    const harness = dependencies(mimeType);
    const result = await processImageOperation(context({ capabilityId, options: {} }), harness.deps);
    expect(result.metadata.outputMimeTypes).toEqual([mimeType]);
  });

  test("rejects codec fallback, pixel-budget overflow, and cancellation without leaking a bitmap", async () => {
    const fallback = dependencies("image/png");
    await expect(processImageOperation(context({ capabilityId: "image.webp-to-jpg", options: { alphaBackground: "#ffffff", quality: 85 } }), fallback.deps)).rejects.toThrow("requested image MIME");
    expect(fallback.close).toHaveBeenCalledTimes(1);

    const oversized = dependencies("image/png", 10_000, 5_000);
    await expect(processImageOperation(context(), oversized.deps)).rejects.toThrow("40 megapixels");
    expect(oversized.close).toHaveBeenCalledTimes(1);

    const cancelled = dependencies("image/png");
    await expect(processImageOperation(context({ isCancelled: () => true }), cancelled.deps)).rejects.toThrow("cancelled");
    expect(cancelled.deps.decode).not.toHaveBeenCalled();
  });
});
