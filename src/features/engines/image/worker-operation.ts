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
    let canvasWidth = bitmap.width;
    let canvasHeight = bitmap.height;

    if (outputOptions.circleCrop) {
      const diameter = Math.min(bitmap.width, bitmap.height);
      canvasWidth = diameter;
      canvasHeight = diameter;
    } else if (outputOptions.cropBox) {
      const { x, y, width, height } = outputOptions.cropBox;
      const clampedX = Math.max(0, Math.min(x, bitmap.width - 1));
      const clampedY = Math.max(0, Math.min(y, bitmap.height - 1));
      const clampedW = Math.max(1, Math.min(width, bitmap.width - clampedX));
      const clampedH = Math.max(1, Math.min(height, bitmap.height - clampedY));
      canvasWidth = Math.round(clampedW);
      canvasHeight = Math.round(clampedH);
    } else if (outputOptions.resizeDimensions) {
      const { width, height, aspectLock } = outputOptions.resizeDimensions;
      if (width && height) {
        if (aspectLock) {
          const ratio = Math.min(width / bitmap.width, height / bitmap.height);
          canvasWidth = Math.max(1, Math.round(bitmap.width * ratio));
          canvasHeight = Math.max(1, Math.round(bitmap.height * ratio));
        } else {
          canvasWidth = Math.round(width);
          canvasHeight = Math.round(height);
        }
      } else if (width) {
        canvasWidth = Math.round(width);
        canvasHeight = Math.max(1, Math.round((bitmap.height * width) / bitmap.width));
      } else if (height) {
        canvasHeight = Math.round(height);
        canvasWidth = Math.max(1, Math.round((bitmap.width * height) / bitmap.height));
      }
      validateDimensions(canvasWidth, canvasHeight);
    } else if (outputOptions.rotationDegrees === 90 || outputOptions.rotationDegrees === 270) {
      canvasWidth = bitmap.height;
      canvasHeight = bitmap.width;
    }

    const canvas = dependencies.createCanvas(canvasWidth, canvasHeight);
    const drawing = canvas.getContext("2d");
    if (!drawing) throw new Error("Image canvas rendering is unavailable");
    if (outputOptions.background) {
      drawing.fillStyle = outputOptions.background;
      drawing.fillRect(0, 0, canvasWidth, canvasHeight);
    }
    if (outputOptions.circleCrop) {
      const diameter = canvasWidth;
      const sx = (bitmap.width - diameter) / 2;
      const sy = (bitmap.height - diameter) / 2;
      if (drawing.beginPath && drawing.arc && drawing.clip) {
        drawing.beginPath();
        drawing.arc(diameter / 2, diameter / 2, diameter / 2, 0, Math.PI * 2);
        drawing.clip();
      }
      drawing.drawImage(bitmap, sx, sy, diameter, diameter, 0, 0, diameter, diameter);
    } else if (outputOptions.cropBox) {
      const { x, y } = outputOptions.cropBox;
      const clampedX = Math.max(0, Math.min(x, bitmap.width - 1));
      const clampedY = Math.max(0, Math.min(y, bitmap.height - 1));
      drawing.drawImage(bitmap, clampedX, clampedY, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight);
    } else if (outputOptions.resizeDimensions && (canvasWidth !== bitmap.width || canvasHeight !== bitmap.height)) {
      drawing.drawImage(bitmap, 0, 0, canvasWidth, canvasHeight);
    } else if (outputOptions.rotationDegrees === 90) {
      drawing.translate(canvasWidth, 0);
      drawing.rotate(Math.PI / 2);
      drawing.drawImage(bitmap, 0, 0);
    } else if (outputOptions.rotationDegrees === 180) {
      drawing.translate(canvasWidth, canvasHeight);
      drawing.rotate(Math.PI);
      drawing.drawImage(bitmap, 0, 0);
    } else if (outputOptions.rotationDegrees === 270) {
      drawing.translate(0, canvasHeight);
      drawing.rotate((3 * Math.PI) / 2);
      drawing.drawImage(bitmap, 0, 0);
    } else if (outputOptions.flipDirection === "horizontal") {
      drawing.translate(canvasWidth, 0);
      drawing.scale(-1, 1);
      drawing.drawImage(bitmap, 0, 0);
    } else if (outputOptions.flipDirection === "vertical") {
      drawing.translate(0, canvasHeight);
      drawing.scale(1, -1);
      drawing.drawImage(bitmap, 0, 0);
    } else {
      drawing.drawImage(bitmap, 0, 0);
    }
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
