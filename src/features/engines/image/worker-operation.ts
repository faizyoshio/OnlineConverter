import type { LocalWorkerOperationContext } from "@/features/workers/local-runtime";
import type { LocalWorkerResult } from "@/features/workers/protocol";

export type ImageOperationDependencies = {
  decode: (input: File) => Promise<ImageBitmap>;
  createCanvas: (width: number, height: number) => OffscreenCanvas;
};

const DEFAULT_DEPENDENCIES: ImageOperationDependencies = {
  decode: (input) => createImageBitmap(input),
  createCanvas: (width, height) => new OffscreenCanvas(width, height),
};

type EncodeOptions = {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  quality?: number;
  background?: string;
};

function percentage(options: Readonly<Record<string, unknown>>, key: string, fallback: number): number {
  const raw = options[key] ?? fallback;
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 1 || raw > 100) {
    throw new Error(`${key} must be between 1 and 100`);
  }
  return raw / 100;
}

function color(options: Readonly<Record<string, unknown>>, key: string, fallback: string): string {
  const raw = options[key] ?? fallback;
  if (typeof raw !== "string" || !/^#[0-9a-f]{6}$/i.test(raw)) throw new Error(`${key} must be a six-digit hexadecimal color`);
  return raw;
}

function encodeOptions(capabilityId: string, options: Readonly<Record<string, unknown>>): EncodeOptions {
  if (capabilityId === "image.jpg-to-modern") {
    if (options.target === "png") return { mimeType: "image/png" };
    if (options.target === "webp") return { mimeType: "image/webp", quality: percentage(options, "webpQuality", 85) };
    throw new Error("JPEG conversion target must be PNG or WebP");
  }
  if (capabilityId === "image.webp-to-jpg") {
    return {
      mimeType: "image/jpeg",
      quality: percentage(options, "quality", 85),
      background: color(options, "alphaBackground", "#ffffff"),
    };
  }
  if (capabilityId === "image.webp-to-png" || capabilityId === "image.jfif-to-png") {
    return { mimeType: "image/png" };
  }
  throw new Error(`Unknown image capability: ${capabilityId}`);
}

function ensureActive(context: LocalWorkerOperationContext): void {
  if (context.isCancelled()) throw new Error("Operation cancelled");
}

function validateDimensions(width: number, height: number): void {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 20_000 || height > 20_000) {
    throw new Error("Decoded image dimensions are invalid or exceed 20,000 pixels per side");
  }
  if (width * height > 40_000_000) throw new Error("Decoded image exceeds the 40 megapixels limit");
}

export async function processImageOperation(
  context: LocalWorkerOperationContext,
  dependencies: ImageOperationDependencies = DEFAULT_DEPENDENCIES,
): Promise<LocalWorkerResult> {
  ensureActive(context);
  const input = context.inputs[0];
  if (!input) throw new Error("An image input is required");
  const outputOptions = encodeOptions(context.capabilityId, context.options);
  context.reportProgress(0.1, "Decoding local image");
  const bitmap = await dependencies.decode(input);
  try {
    validateDimensions(bitmap.width, bitmap.height);
    ensureActive(context);
    context.reportProgress(0.5, "Rendering local image");
    const canvas = dependencies.createCanvas(bitmap.width, bitmap.height);
    const drawing = canvas.getContext("2d");
    if (!drawing) throw new Error("Image canvas rendering is unavailable");
    if (outputOptions.background) {
      drawing.fillStyle = outputOptions.background;
      drawing.fillRect(0, 0, bitmap.width, bitmap.height);
    }
    drawing.drawImage(bitmap, 0, 0);
    ensureActive(context);
    context.reportProgress(0.8, "Encoding local image");
    const blob = await canvas.convertToBlob({
      type: outputOptions.mimeType,
      ...(outputOptions.quality === undefined ? {} : { quality: outputOptions.quality }),
    });
    if (blob.type !== outputOptions.mimeType) throw new Error("Browser did not produce the requested image MIME type");
    ensureActive(context);
    context.reportProgress(0.95, "Finalizing image");
    return {
      mode: "files",
      outputs: [{ blob }],
      metadata: { resultMode: "files", outputMimeTypes: [blob.type], outputBytes: [blob.size] },
    };
  } finally {
    bitmap.close();
  }
}
