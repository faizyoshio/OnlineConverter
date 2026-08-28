import { validateOptionValues } from "@/features/capabilities";
import type { CapabilityManifest } from "@/features/capabilities/schema";
import { detectSignature } from "./signatures";
import { validateBatch, validateProbe } from "./validate";
import type { CapabilityValidator, ProbeAndValidateAdapter, ValidationIssue } from "./types";

function issue(
  code: ValidationIssue["code"],
  field: string,
  message: string,
  measured?: number,
  limit?: number,
): ValidationIssue {
  return {
    code,
    field,
    message,
    ...(measured === undefined ? {} : { measured }),
    ...(limit === undefined ? {} : { limit }),
  };
}

function deduplicate(issues: readonly ValidationIssue[]): readonly ValidationIssue[] {
  const seen = new Set<string>();
  return issues.filter((item) => {
    const key = [item.code, item.field, item.measured ?? "", item.limit ?? "", item.message].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function readHeader(file: File): Promise<Uint8Array> {
  const blob = file.slice(0, 32);
  const withArrayBuffer = blob as Blob & { arrayBuffer?: () => Promise<ArrayBuffer> };
  if (typeof withArrayBuffer.arrayBuffer === "function") {
    return new Uint8Array(await withArrayBuffer.arrayBuffer());
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("header-read-failed"));
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(new Uint8Array(reader.result));
      else reject(new Error("header-read-failed"));
    };
    reader.readAsArrayBuffer(blob);
  });
}

function hasUnsafeRelativeName(file: File): boolean {
  const name = file.webkitRelativePath || file.name;
  if (!name || name.includes("\0") || /^[a-z]:/i.test(name) || /^[\\/]/.test(name)) return true;
  return name.split(/[\\/]/).some((segment) => segment === "..");
}

async function validateCheapPhase(
  capability: CapabilityManifest,
  files: readonly File[],
  options: Readonly<Record<string, unknown>>,
): Promise<readonly ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  try {
    validateOptionValues(capability, options);
  } catch {
    issues.push(issue("malformed-input", "options", "One or more option values are invalid."));
  }

  if (capability.inputMode === "values") {
    if (files.length > 0) issues.push(issue("malformed-input", "files", "This tool accepts values instead of files.", files.length, 0));
  } else {
    if (files.length < capability.limits.minimumFiles) {
      issues.push(issue("malformed-input", "files", "More local input files are required.", files.length, capability.limits.minimumFiles));
    }
    if (files.length > capability.limits.maximumFiles) {
      issues.push(issue("limit-exceeded", "files", "Too many local input files were selected.", files.length, capability.limits.maximumFiles));
    }
  }

  issues.push(...validateBatch(files));

  if (capability.id === "archive.zip-create") {
    files.forEach((file, index) => {
      if (hasUnsafeRelativeName(file)) {
        issues.push(issue("malformed-input", "files[" + index + "].name", "A selected relative path is unsafe for a local ZIP archive."));
      }
    });
  }

  const opaqueInput = capability.id === "archive.zip-create" && capability.inputs.some((input) => input.probeRule === "opaque-local-file");
  if (!opaqueInput) {
    for (const [index, file] of files.entries()) {
      try {
        const detection = detectSignature(await readHeader(file));
        if (detection.confidence === "exact") {
          const supported = capability.inputs.some(
            (input) => input.kind === detection.kind && input.probeRule === detection.probeRule,
          );
          if (!supported) {
            issues.push(issue("unsupported-format", "files[" + index + "].format", "The detected local file format is not supported by this tool."));
          }
        }
      } catch {
        issues.push(issue("malformed-input", "files[" + index + "].signature", "The local file header could not be inspected."));
      }
    }
  }

  return deduplicate(issues);
}

export function createCapabilityValidator(): CapabilityValidator {
  return {
    validateCheap(capability, files, options) {
      return validateCheapPhase(capability, files, options);
    },
    async validateWithAdapter(
      capability: CapabilityManifest,
      files: readonly File[],
      options: Readonly<Record<string, unknown>>,
      adapter: ProbeAndValidateAdapter<Readonly<Record<string, unknown>>>,
    ) {
      const cheapIssues = await validateCheapPhase(capability, files, options);
      if (cheapIssues.length > 0) return cheapIssues;

      const probes = [];
      for (const [index, file] of files.entries()) {
        try {
          probes.push(await adapter.probe(file));
        } catch {
          return [issue("malformed-input", "files[" + index + "].probe", "The local parser could not inspect this input.")];
        }
      }

      const probeIssues = probes.flatMap((probe) => validateProbe(probe, capability));
      if (probeIssues.length > 0) return deduplicate(probeIssues);

      try {
        return deduplicate(await adapter.validate(files, options));
      } catch {
        return [issue("device-capability", "adapter", "The browser could not complete local capability validation.")];
      }
    },
  };
}

export const capabilityValidator = createCapabilityValidator();
