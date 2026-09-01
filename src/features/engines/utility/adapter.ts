import "client-only";
import { generateBarcodeSvg, type BarcodeFormat } from "@/engines/utility/barcode";
import { convertTime, convertUnits, generatePassword } from "@/engines/utility/operations";
import type { FileProbe, ValidationIssue } from "@/features/validation/types";
import type { EngineAdapter, WorkerLike } from "@/features/workers/adapter";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";

export type UtilityCapabilityId = "utility.unit" | "utility.time" | "utility.barcode" | "utility.password";

function malformedOptionsIssue(): ValidationIssue {
  return { code: "malformed-input", field: "options", message: "One or more local utility values are invalid." };
}

function stringOption(options: Readonly<Record<string, unknown>>, key: string): string {
  const value = options[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`${key} is required`);
  return value.trim();
}

function numberOption(options: Readonly<Record<string, unknown>>, key: string): number {
  const value = options[key];
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${key} must be numeric`);
  return value;
}

async function validateOptions(capabilityId: UtilityCapabilityId, options: Readonly<Record<string, unknown>>): Promise<void> {
  if (capabilityId === "utility.unit") {
    convertUnits(numberOption(options, "value"), stringOption(options, "category"), stringOption(options, "fromUnit"), stringOption(options, "toUnit"), typeof options.maxSignificantDigits === "number" ? options.maxSignificantDigits : 8);
    return;
  }
  if (capabilityId === "utility.time") {
    convertTime(stringOption(options, "dateTime"), stringOption(options, "fromZone"), stringOption(options, "toZone"));
    return;
  }
  if (capabilityId === "utility.password") {
    generatePassword({ length: numberOption(options, "length"), uppercase: options.uppercase !== false, lowercase: options.lowercase !== false, digits: options.digits !== false, symbols: options.symbols !== false, excludeAmbiguous: options.excludeAmbiguous !== false });
    return;
  }
  await generateBarcodeSvg({ text: stringOption(options, "text"), format: stringOption(options, "format") as BarcodeFormat, quietZonePx: numberOption(options, "quietZonePx") });
  const target = stringOption(options, "target");
  if (target !== "svg" && target !== "png") throw new Error("Invalid barcode target");
}

export function createUtilityAdapter(capabilityId: UtilityCapabilityId): EngineAdapter<Readonly<Record<string, unknown>>> {
  return {
    async probe(input: File): Promise<FileProbe> {
      return { kind: "unknown", probeRule: "unknown", bytes: input.size };
    },
    async validate(_inputs, options): Promise<readonly ValidationIssue[]> {
      try { await validateOptions(capabilityId, options); return []; }
      catch { return [malformedOptionsIssue()]; }
    },
    createWorker(): WorkerLike {
      return new BrowserWorkerBridge(new Worker(new URL("../../workers/utility.worker.ts", import.meta.url), { type: "module" }));
    },
  };
}
