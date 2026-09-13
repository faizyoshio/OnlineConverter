import { describe, expect, test, vi } from "vitest";
import type { LocalWorkerOperationContext } from "@/features/workers/local-runtime";
import { createImageFlipAdapter } from "./image-flip";
import { processImageOperation, type ImageOperationDependencies } from "./image/worker-operation";

function createContext(overrides: Partial<LocalWorkerOperationContext> = {}): LocalWorkerOperationContext {
  return {
    capabilityId: "image.flip",
    jobId: "flip-job",
    inputs: [new File([new Uint8Array([0xff, 0xd8, 0xff])], "source.jpg", { type: "image/jpeg" })],
    options: { direction: "horizontal", target: "png" },
    isCancelled: () => false,
    reportProgress: () => undefined,
    ...overrides,
  };
}

function createHarness(outputType = "image/png", width = 400, height = 300) {
  const close = vi.fn();
  const fillRect = vi.fn();
  const drawImage = vi.fn();
  const translate = vi.fn();
  const rotate = vi.fn();
  const scale = vi.fn();
  const convertToBlob = vi.fn(async (options?: { type?: string; quality?: number }) => {
    const type = options?.type ?? outputType;
    return new Blob([new Uint8Array([1, 2, 3])], { type });
  });

  const deps: ImageOperationDependencies = {
    decode: vi.fn(async () => ({ width, height, close } as unknown as ImageBitmap)),
    createCanvas: vi.fn((w: number, h: number) => ({
      width: w,
      height: h,
      getContext: () => ({ fillStyle: "", fillRect, drawImage, translate, rotate, scale }),
      convertToBlob,
    } as unknown as OffscreenCanvas)),
  };

  return { deps, close, fillRect, drawImage, translate, rotate, scale, convertToBlob };
}

describe("Image Flip Adapter", () => {
  describe("probe", () => {
    test("probes decoded JPEG input correctly", async () => {
      const close = vi.fn();
      const adapter = createImageFlipAdapter({ decode: async () => ({ width: 150, height: 250, close }) as unknown as ImageBitmap });
      const file = new File([Uint8Array.from([0xff, 0xd8, 0xff])], "test.jpg");
      await expect(adapter.probe(file)).resolves.toEqual({ kind: "jpeg", probeRule: "jpeg-soi", bytes: 3, width: 150, height: 250 });
      expect(close).toHaveBeenCalledOnce();
    });

    test("probes PNG, WebP, and BMP inputs", async () => {
      const close = vi.fn();
      const adapter = createImageFlipAdapter({ decode: async () => ({ width: 150, height: 250, close }) as unknown as ImageBitmap });

      const pngFile = new File([Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "test.png");
      await expect(adapter.probe(pngFile)).resolves.toEqual({ kind: "png", probeRule: "png-signature", bytes: 8, width: 150, height: 250 });

      const webpFile = new File([Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])], "test.webp");
      await expect(adapter.probe(webpFile)).resolves.toEqual({ kind: "webp", probeRule: "webp-riff", bytes: 12, width: 150, height: 250 });

      const bmpFile = new File([Uint8Array.from([0x42, 0x4d, 0x00, 0x00])], "test.bmp");
      await expect(adapter.probe(bmpFile)).resolves.toEqual({ kind: "bmp", probeRule: "bmp-header", bytes: 4, width: 150, height: 250 });
    });

    test("returns unknown probe for unsupported file format", async () => {
      const adapter = createImageFlipAdapter();
      const file = new File([new Uint8Array([0x00, 0x01, 0x02, 0x03])], "unknown.bin");
      await expect(adapter.probe(file)).resolves.toEqual({ kind: "unknown", probeRule: "unknown", bytes: 0 });
    });
  });

  describe("validation", () => {
    const adapter = createImageFlipAdapter();
    const dummyFile = new File([Uint8Array.from([0xff, 0xd8, 0xff])], "test.jpg");

    test.each(["horizontal", "vertical"])("accepts valid flip direction: %s", async (direction) => {
      await expect(adapter.validate([dummyFile], { direction, target: "png" })).resolves.toEqual([]);
    });

    test.each(["png", "jpeg", "webp", "bmp"])("accepts valid output format: %s", async (target) => {
      await expect(adapter.validate([dummyFile], { direction: "horizontal", target })).resolves.toEqual([]);
    });

    test("accepts empty options falling back to default direction (horizontal) and target (png)", async () => {
      await expect(adapter.validate([dummyFile], {})).resolves.toEqual([]);
    });

    test.each(["diagonal", "both", "none", "horizontal-vertical", "", 123])("rejects invalid flip direction: %s", async (direction) => {
      const issues = await adapter.validate([dummyFile], { direction, target: "png" });
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]?.code).toBe("malformed-input");
    });

    test.each(["gif", "svg", "tiff", "pdf", 123])("rejects invalid output target format: %s", async (target) => {
      const issues = await adapter.validate([dummyFile], { direction: "horizontal", target });
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0]?.code).toBe("malformed-input");
    });
  });

  describe("worker operation", () => {
    test("flips image horizontally preserving canvas dimensions", async () => {
      const harness = createHarness("image/png", 400, 300);
      await processImageOperation(createContext({
        options: { direction: "horizontal", target: "png" },
      }), harness.deps);

      expect(harness.deps.createCanvas).toHaveBeenCalledWith(400, 300);
      expect(harness.translate).toHaveBeenCalledWith(400, 0);
      expect(harness.scale).toHaveBeenCalledWith(-1, 1);
      expect(harness.drawImage).toHaveBeenCalledTimes(1);
      expect(harness.close).toHaveBeenCalledOnce();
    });

    test("flips image vertically preserving canvas dimensions", async () => {
      const harness = createHarness("image/png", 400, 300);
      await processImageOperation(createContext({
        options: { direction: "vertical", target: "png" },
      }), harness.deps);

      expect(harness.deps.createCanvas).toHaveBeenCalledWith(400, 300);
      expect(harness.translate).toHaveBeenCalledWith(0, 300);
      expect(harness.scale).toHaveBeenCalledWith(1, -1);
      expect(harness.drawImage).toHaveBeenCalledTimes(1);
      expect(harness.close).toHaveBeenCalledOnce();
    });

    test("encodes output to PNG without background fill", async () => {
      const harness = createHarness("image/png", 400, 300);
      const result = await processImageOperation(createContext({
        options: { direction: "horizontal", target: "png" },
      }), harness.deps);

      expect(harness.fillRect).not.toHaveBeenCalled();
      expect(harness.convertToBlob).toHaveBeenCalledWith({ type: "image/png" });
      expect(result.metadata.outputMimeTypes).toEqual(["image/png"]);
    });

    test("encodes output to JPEG with white alpha background and quality 0.85", async () => {
      const harness = createHarness("image/jpeg", 400, 300);
      const result = await processImageOperation(createContext({
        options: { direction: "horizontal", target: "jpeg" },
      }), harness.deps);

      expect(harness.fillRect).toHaveBeenCalledWith(0, 0, 400, 300);
      expect(harness.convertToBlob).toHaveBeenCalledWith({ type: "image/jpeg", quality: 0.85 });
      expect(result.metadata.outputMimeTypes).toEqual(["image/jpeg"]);
    });

    test("encodes output to WebP with quality 0.85 and no background fill", async () => {
      const harness = createHarness("image/webp", 400, 300);
      const result = await processImageOperation(createContext({
        options: { direction: "vertical", target: "webp" },
      }), harness.deps);

      expect(harness.fillRect).not.toHaveBeenCalled();
      expect(harness.convertToBlob).toHaveBeenCalledWith({ type: "image/webp", quality: 0.85 });
      expect(result.metadata.outputMimeTypes).toEqual(["image/webp"]);
    });

    test("encodes output to PNG fallback when target is BMP (canvas does not support BMP)", async () => {
      const harness = createHarness("image/png", 400, 300);
      const result = await processImageOperation(createContext({
        options: { direction: "horizontal", target: "bmp" },
      }), harness.deps);

      expect(harness.convertToBlob).toHaveBeenCalledWith({ type: "image/png" });
      expect(result.metadata.outputMimeTypes).toEqual(["image/png"]);
    });

    test("cleans up ImageBitmap on cancellation or decode error", async () => {
      const harness = createHarness("image/png");
      await expect(processImageOperation(createContext({ isCancelled: () => true }), harness.deps)).rejects.toThrow("cancelled");
      expect(harness.deps.decode).not.toHaveBeenCalled();

      const failHarness = createHarness("image/png", 0, 0);
      await expect(processImageOperation(createContext(), failHarness.deps)).rejects.toThrow();
      expect(failHarness.close).toHaveBeenCalledOnce();
    });
  });
});
