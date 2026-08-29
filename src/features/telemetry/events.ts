import type { JobErrorCode } from "@/features/jobs/types";

export const telemetryStages = [
  "validating",
  "loading-engine",
  "processing",
  "success",
  "warning",
  "failure",
  "cancelled",
] as const;

export const durationBuckets = ["<1s", "1-5s", "5-30s", "30-120s", ">120s"] as const;
export const deviceClasses = ["mobile", "tablet", "desktop"] as const;

export type TelemetryStage = (typeof telemetryStages)[number];
export type DurationBucket = (typeof durationBuckets)[number];
export type DeviceClass = (typeof deviceClasses)[number];

export type TelemetryEvent = {
  capabilityId: string;
  stage: TelemetryStage;
  durationBucket: DurationBucket;
  deviceClass: DeviceClass;
  errorCode?: JobErrorCode;
  appVersion: string;
  engineVersion: string;
};
