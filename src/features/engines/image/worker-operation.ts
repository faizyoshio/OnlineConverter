import type { LocalWorkerOperationContext } from "@/features/workers/local-runtime";
import type { LocalWorkerResult } from "@/features/workers/protocol";
import { parseImageCodecCapabilityId, resolveImageEncodeOptions } from "./options";

export type ImageOperationDependencies = {
  decode: (input: File) => Promise<ImageBitmap>;
  createCanvas: (width: number, height: number) => OffscreenCanvas;
};

const DEFAULT_DEPENDENCIES: ImageOperationDependencies = {
  decode: (input) => createImageBitmap(input),
  createCanvas: (width, height) => new OffscreenCanvas(width, height),
};

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
  const outputOptions = resolveImageEncodeOptions(parseImageCodecCapabilityId(context.capabilityId), context.options);
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
