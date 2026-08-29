import { capabilityRegistry } from "@/features/capabilities";
import type { JobErrorCode } from "@/features/jobs/types";
import {
  deviceClasses,
  durationBuckets,
  telemetryStages,
  type TelemetryEvent,
} from "./events";

const capabilityIds = new Set(capabilityRegistry.map((capability) => capability.id));
const errorCodes = new Set<JobErrorCode>([
  "unsupported-format",
  "limit-exceeded",
  "encrypted-or-corrupt",
  "device-capability",
  "engine-load-failed",
  "conversion-failed",
  "cancelled",
]);
const safeVersion = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null;
}

function readString(input: Readonly<Record<string, unknown>>, key: string): string {
  const value = input[key];
  if (typeof value !== "string") throw new TypeError(`Invalid ${key}`);
  return value;
}

function readAllowed<T extends string>(
  input: Readonly<Record<string, unknown>>,
  key: string,
  allowed: readonly T[],
  message: string,
): T {
  const value = readString(input, key);
  if (!allowed.includes(value as T)) throw new TypeError(message);
  return value as T;
}

function readVersion(input: Readonly<Record<string, unknown>>, key: "appVersion" | "engineVersion"): string {
  const value = readString(input, key);
  if (!safeVersion.test(value)) throw new TypeError(`Invalid ${key}`);
  return value;
}

export function buildTelemetryEvent(input: unknown): TelemetryEvent {
  if (!isRecord(input)) throw new TypeError("Invalid telemetry event");

  const capabilityId = readString(input, "capabilityId");
  if (!capabilityIds.has(capabilityId)) throw new TypeError("Unknown capability ID");

  const stage = readAllowed(input, "stage", telemetryStages, "Invalid telemetry stage");
  const durationBucket = readAllowed(input, "durationBucket", durationBuckets, "Invalid duration bucket");
  const deviceClass = readAllowed(input, "deviceClass", deviceClasses, "Invalid device class");
  const error = input.errorCode;
  if (error !== undefined && (typeof error !== "string" || !errorCodes.has(error as JobErrorCode))) {
    throw new TypeError("Invalid error code");
  }

  const event: TelemetryEvent = {
    capabilityId,
    stage,
    durationBucket,
    deviceClass,
    appVersion: readVersion(input, "appVersion"),
    engineVersion: readVersion(input, "engineVersion"),
  };
  if (error !== undefined) event.errorCode = error as JobErrorCode;
  return event;
}
