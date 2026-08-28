export type JobPhase =
  | "idle"
  | "validating"
  | "ready"
  | "loading-engine"
  | "processing"
  | "success"
  | "success-with-warnings"
  | "failure"
  | "cancelled"
  | "cleanup";

export type JobErrorCode =
  | "unsupported-format"
  | "limit-exceeded"
  | "encrypted-or-corrupt"
  | "device-capability"
  | "engine-load-failed"
  | "conversion-failed"
  | "cancelled";

export type NormalizedJobError = {
  code: JobErrorCode;
  publicMessage: string;
  retryable: boolean;
  phase: JobPhase;
};

export type JobResultMetadata = {
  resultMode: "files" | "selected-entries" | "value";
  outputMimeTypes: readonly string[];
  outputBytes: readonly number[];
  pages?: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  frames?: number;
};

export type JobState = {
  phase: JobPhase;
  progress: number | null;
  stageLabel: string | null;
  warnings: readonly string[];
  error: NormalizedJobError | null;
  result: JobResultMetadata | null;
};

export type JobAction =
  | { type: "start-validation" }
  | { type: "validation-passed" }
  | { type: "engine-loading"; stageLabel: string }
  | { type: "processing-started"; stageLabel: string }
  | { type: "progress"; value: number | null; stageLabel: string }
  | { type: "warning"; code: string }
  | { type: "succeeded"; result: JobResultMetadata }
  | { type: "failed"; error: NormalizedJobError }
  | { type: "cancelled" }
  | { type: "cleanup-started" }
  | { type: "cleaned" };
