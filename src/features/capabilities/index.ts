import { capabilityManifestSchema, type CapabilityManifest } from "./schema";
import { gifCapabilities } from "./registry/gif";
import { imageCapabilities } from "./registry/image";
import { pdfCapabilities } from "./registry/pdf";
import { trustCapabilities } from "./registry/trust";
import { utilityCapabilities } from "./registry/utility";

export function assertValidRegistry(input: readonly unknown[]): readonly CapabilityManifest[] {
  const parsed = input.map((item) => capabilityManifestSchema.parse(item));
  if (new Set(parsed.map((item) => item.id)).size !== parsed.length) {
    throw new Error("Duplicate capability id");
  }
  if (new Set(parsed.map((item) => item.slug)).size !== parsed.length) {
    throw new Error("Duplicate capability slug");
  }
  return Object.freeze(parsed);
}

export const capabilityRegistry = assertValidRegistry([
  ...pdfCapabilities,
  ...imageCapabilities,
  ...gifCapabilities,
  ...utilityCapabilities,
  ...trustCapabilities,
]);

export function getCapabilityBySlug(slug: string): CapabilityManifest | undefined {
  return capabilityRegistry.find((item) => item.slug === slug);
}

function expectedPrimitive(field: CapabilityManifest["optionFields"][number]): "string" | "number" | "boolean" {
  if (field.control === "number" || field.control === "range") return "number";
  if (field.control === "toggle") return "boolean";
  return "string";
}

export function validateOptionValues(
  manifest: CapabilityManifest,
  input: Readonly<Record<string, unknown>>,
): Readonly<Record<string, string | number | boolean | null>> {
  const knownKeys = new Set(manifest.optionFields.map((field) => field.key));
  for (const key of Object.keys(input)) {
    if (!knownKeys.has(key)) throw new Error("Invalid option: " + key);
  }

  const values: Record<string, string | number | boolean | null> = {};
  for (const field of manifest.optionFields) {
    const value = Object.hasOwn(input, field.key) ? input[field.key] : field.defaultValue;
    if (value === null) {
      if (field.required) throw new Error("Invalid option: " + field.key + " is required");
      values[field.key] = null;
      continue;
    }
    if (typeof value !== expectedPrimitive(field)) {
      throw new Error("Invalid option: " + field.key + " has the wrong type");
    }
    if (field.choices && !field.choices.some((choice) => Object.is(choice.value, value))) {
      throw new Error("Invalid option: " + field.key + " is not an allowed choice");
    }
    if (typeof value === "number") {
      if (field.minimum !== undefined && value < field.minimum) {
        throw new Error("Invalid option: " + field.key + " is below the minimum");
      }
      if (field.maximum !== undefined && value > field.maximum) {
        throw new Error("Invalid option: " + field.key + " exceeds the maximum");
      }
      if (field.step !== undefined) {
        const base = field.minimum ?? 0;
        const steps = (value - base) / field.step;
        if (Math.abs(steps - Math.round(steps)) > Number.EPSILON * 16) {
          throw new Error("Invalid option: " + field.key + " does not match the required step");
        }
      }
    }
    values[field.key] = value as string | number | boolean;
  }
  return Object.freeze(values);
}

export type { CapabilityCategory, CapabilityId, CapabilityManifest } from "./schema";
