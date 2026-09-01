import { generateBarcodeSvg, type BarcodeFormat } from "@/engines/utility/barcode";
import { convertTime, convertUnits, generatePassword, type PasswordOptions } from "@/engines/utility/operations";
import type { LocalWorkerOperationContext } from "@/features/workers/local-runtime";
import type { LocalWorkerResult } from "@/features/workers/protocol";

export type UtilityOperationDependencies = {
  generatePassword: (options: PasswordOptions) => string;
  generateBarcodeSvg: typeof generateBarcodeSvg;
  svgToPng: (svg: string) => Promise<Blob>;
};

async function browserSvgToPng(svg: string): Promise<Blob> {
  if (typeof createImageBitmap !== "function" || typeof OffscreenCanvas === "undefined") {
    throw new Error("PNG barcode rendering is unavailable in this browser");
  }
  const bitmap = await createImageBitmap(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const drawing = canvas.getContext("2d");
    if (!drawing) throw new Error("PNG barcode canvas is unavailable");
    drawing.drawImage(bitmap, 0, 0);
    return canvas.convertToBlob({ type: "image/png" });
  } finally {
    bitmap.close();
  }
}

const DEFAULT_DEPENDENCIES: UtilityOperationDependencies = {
  generatePassword,
  generateBarcodeSvg,
  svgToPng: browserSvgToPng,
};

function requiredString(options: Readonly<Record<string, unknown>>, key: string): string {
  const value = options[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is required`);
  return value.trim();
}

function requiredNumber(options: Readonly<Record<string, unknown>>, key: string): number {
  const value = options[key];
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${key} must be a numeric value`);
  return value;
}

function valueResult(value: Extract<LocalWorkerResult, { mode: "value" }> ["value"]): LocalWorkerResult {
  return { mode: "value", value, metadata: { resultMode: "value", outputMimeTypes: [], outputBytes: [] } };
}

function ensureActive(context: LocalWorkerOperationContext): void {
  if (context.isCancelled()) throw new Error("Operation cancelled");
}

function barcodeFormat(value: string): BarcodeFormat {
  if (["code-128", "code-39", "ean-13", "ean-8", "upc-a", "itf-14", "codabar", "qr"].includes(value)) return value as BarcodeFormat;
  throw new Error("Unsupported barcode format");
}

export async function processUtilityOperation(
  context: LocalWorkerOperationContext,
  dependencies: UtilityOperationDependencies = DEFAULT_DEPENDENCIES,
): Promise<LocalWorkerResult> {
  const { capabilityId, options, reportProgress } = context;
  ensureActive(context);
  reportProgress(0.1, "Validating values");

  if (capabilityId === "utility.unit") {
    const value = requiredNumber(options, "value");
    const category = requiredString(options, "category");
    const fromUnit = requiredString(options, "fromUnit");
    const toUnit = requiredString(options, "toUnit");
    const digits = typeof options.maxSignificantDigits === "number" ? options.maxSignificantDigits : 8;
    ensureActive(context);
    reportProgress(0.55, "Converting units");
    const converted = convertUnits(value, category, fromUnit, toUnit, digits);
    ensureActive(context);
    reportProgress(0.95, "Finalizing result");
    return valueResult({ kind: "number", ...converted });
  }

  if (capabilityId === "utility.time") {
    const dateTime = requiredString(options, "dateTime");
    const fromZone = requiredString(options, "fromZone");
    const toZone = requiredString(options, "toZone");
    ensureActive(context);
    reportProgress(0.55, "Converting time zone");
    const converted = convertTime(dateTime, fromZone, toZone);
    ensureActive(context);
    reportProgress(0.95, "Finalizing result");
    return valueResult({ kind: "time", ...converted });
  }

  if (capabilityId === "utility.password") {
    const passwordOptions: PasswordOptions = {
      length: requiredNumber(options, "length"),
      uppercase: options.uppercase !== false,
      lowercase: options.lowercase !== false,
      digits: options.digits !== false,
      symbols: options.symbols !== false,
      excludeAmbiguous: options.excludeAmbiguous !== false,
    };
    ensureActive(context);
    reportProgress(0.55, "Generating secure password");
    const value = dependencies.generatePassword(passwordOptions);
    ensureActive(context);
    reportProgress(0.95, "Finalizing result");
    return valueResult({ kind: "password", value });
  }

  if (capabilityId === "utility.barcode") {
    const text = requiredString(options, "text");
    const format = barcodeFormat(requiredString(options, "format"));
    const target = requiredString(options, "target");
    const quietZonePx = requiredNumber(options, "quietZonePx");
    ensureActive(context);
    reportProgress(0.45, "Generating barcode");
    const svg = await dependencies.generateBarcodeSvg({ text, format, quietZonePx });
    ensureActive(context);
    const output = target === "svg"
      ? new Blob([svg], { type: "image/svg+xml" })
      : target === "png"
        ? await dependencies.svgToPng(svg)
        : (() => { throw new Error("Unsupported barcode output format"); })();
    ensureActive(context);
    reportProgress(0.95, "Finalizing barcode");
    return { mode: "files", outputs: [{ blob: output }], metadata: { resultMode: "files", outputMimeTypes: [output.type], outputBytes: [output.size] } };
  }

  throw new Error(`Unknown utility capability: ${capabilityId}`);
}
