import { normalizeJobError } from "./errors";
import type { JobAction, JobPhase, JobState } from "./types";

export const INITIAL_JOB_STATE: JobState = Object.freeze({
  phase: "idle",
  progress: null,
  stageLabel: null,
  warnings: Object.freeze([]),
  error: null,
  result: null,
});

const allowedActions = {
  idle: ["start-validation"],
  validating: ["validation-passed", "failed", "cancelled"],
  ready: ["engine-loading", "failed", "cancelled"],
  "loading-engine": ["progress", "warning", "processing-started", "failed", "cancelled"],
  processing: ["progress", "warning", "succeeded", "failed", "cancelled"],
  success: ["cleanup-started"],
  "success-with-warnings": ["cleanup-started"],
  failure: ["start-validation", "cleanup-started"],
  cancelled: ["start-validation", "cleanup-started"],
  cleanup: ["cleaned"],
} as const satisfies Record<JobPhase, readonly JobAction["type"][]>;

function invalidTransition(state: JobState, action: JobAction): JobState {
  if (process.env.NODE_ENV !== "production") {
    throw new Error("Invalid job transition: " + state.phase + " -> " + action.type);
  }
  return state;
}

function clampProgress(value: number | null): number | null {
  if (value === null) return null;
  return Math.min(1, Math.max(0, value));
}

export function jobReducer(state: JobState, action: JobAction): JobState {
  const allowed = allowedActions[state.phase] as readonly JobAction["type"][];
  if (!allowed.includes(action.type)) return invalidTransition(state, action);

  switch (action.type) {
    case "start-validation":
      return { ...INITIAL_JOB_STATE, phase: "validating" };
    case "validation-passed":
      return { ...state, phase: "ready", progress: null, stageLabel: null, error: null, result: null };
    case "engine-loading":
      return { ...state, phase: "loading-engine", progress: null, stageLabel: action.stageLabel, error: null, result: null };
    case "processing-started":
      return { ...state, phase: "processing", progress: null, stageLabel: action.stageLabel };
    case "progress":
      return { ...state, progress: clampProgress(action.value), stageLabel: action.stageLabel };
    case "warning":
      return state.warnings.includes(action.code)
        ? state
        : { ...state, warnings: [...state.warnings, action.code] };
    case "succeeded":
      return {
        ...state,
        phase: state.warnings.length > 0 ? "success-with-warnings" : "success",
        progress: 1,
        stageLabel: "Complete",
        error: null,
        result: action.result,
      };
    case "failed":
      return { ...state, phase: "failure", progress: null, stageLabel: null, error: action.error, result: null };
    case "cancelled":
      return {
        ...state,
        phase: "cancelled",
        progress: null,
        stageLabel: null,
        error: normalizeJobError({ code: "cancelled", phase: state.phase }, state.phase),
        result: null,
      };
    case "cleanup-started":
      return { ...state, phase: "cleanup", progress: null, stageLabel: "Cleaning up", result: null };
    case "cleaned":
      return INITIAL_JOB_STATE;
  }
}

export type { JobAction, JobResultMetadata, JobState, NormalizedJobError } from "./types";
