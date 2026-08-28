import type { JobErrorCode, JobPhase, NormalizedJobError } from "./types";

const publicMessages: Record<JobErrorCode, string> = {
  "unsupported-format": "This file format is not supported by this tool.",
  "limit-exceeded": "The selected input exceeds this tool's local limit.",
  "encrypted-or-corrupt": "The local input is encrypted, corrupted, or cannot be read.",
  "device-capability": "This browser or device cannot complete the local operation.",
  "engine-load-failed": "The local conversion engine could not be loaded.",
  "conversion-failed": "The local conversion could not be completed.",
  cancelled: "The local conversion was cancelled.",
};

const retryable: Record<JobErrorCode, boolean> = {
  "unsupported-format": false,
  "limit-exceeded": false,
  "encrypted-or-corrupt": false,
  "device-capability": true,
  "engine-load-failed": true,
  "conversion-failed": true,
  cancelled: true,
};

const errorCodes = new Set<JobErrorCode>(Object.keys(publicMessages) as JobErrorCode[]);
const jobPhases = new Set<JobPhase>([
  "idle", "validating", "ready", "loading-engine", "processing", "success",
  "success-with-warnings", "failure", "cancelled", "cleanup",
]);

function taggedString(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = Reflect.get(value, key);
  return typeof candidate === "string" ? candidate : undefined;
}

export function normalizeJobError(value: unknown, fallbackPhase: JobPhase = "processing"): NormalizedJobError {
  const taggedCode = taggedString(value, "code");
  const code = taggedCode && errorCodes.has(taggedCode as JobErrorCode)
    ? taggedCode as JobErrorCode
    : "conversion-failed";
  const taggedPhase = taggedString(value, "phase");
  const phase = taggedPhase && jobPhases.has(taggedPhase as JobPhase)
    ? taggedPhase as JobPhase
    : fallbackPhase;
  return {
    code,
    publicMessage: publicMessages[code],
    retryable: retryable[code],
    phase,
  };
}
