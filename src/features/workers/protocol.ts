import "client-only";
import type { JobResultMetadata } from "@/features/jobs/types";

export type WorkerRequest =
  | { type: "initialize"; jobId: string; capabilityId: string }
  | { type: "process"; jobId: string; inputs: readonly File[]; options: Readonly<Record<string, unknown>> }
  | { type: "cancel"; jobId: string }
  | { type: "dispose"; jobId: string };

export type WorkerResponse =
  | { type: "ready"; jobId: string }
  | { type: "progress"; jobId: string; value: number | null; stageLabel: string }
  | { type: "warning"; jobId: string; code: string }
  | { type: "result"; jobId: string; result: LocalWorkerResult }
  | { type: "failure"; jobId: string; code: string }
  | { type: "cancelled"; jobId: string }
  | { type: "disposed"; jobId: string };

export type LocalOutput = {
  blob: Blob;
  suggestedDownloadName?: string;
};

export type LocalValuePayload =
  | { kind: "number"; display: string; numericValue: number; unit?: string }
  | { kind: "text"; text: string }
  | { kind: "time"; display: string; iso: string; zone: string; utcOffset: string }
  | { kind: "color"; hex: string; rgb: string; hsl: string }
  | { kind: "palette"; colors: readonly { hex: string; proportion: number }[] }
  | { kind: "password"; value: string };

export type LocalResultPayload =
  | { mode: "files"; outputs: readonly LocalOutput[] }
  | { mode: "selected-entries"; outputs: readonly LocalOutput[] }
  | { mode: "value"; value: LocalValuePayload };

export type LocalWorkerResult = LocalResultPayload & {
  metadata: JobResultMetadata;
};
