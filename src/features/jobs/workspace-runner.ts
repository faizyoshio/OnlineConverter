import "client-only";
import type { CapabilityManifest } from "@/features/capabilities/schema";
import type { CapabilityValidator, ValidationIssue } from "@/features/validation/types";
import type { EngineRouter } from "@/features/workers/router";
import type { EngineAdapter } from "@/features/workers/adapter";
import type { LocalWorkerResult } from "@/features/workers/protocol";
import type { ResultManager, ManagedResult } from "@/features/results/result-manager";
import type { BrowserJobController } from "./controller";
import type { JobAction, JobState } from "./types";
import { normalizeJobError } from "./errors";
import { jobReducer, INITIAL_JOB_STATE } from "./reducer";

export interface WorkspaceJobRunner {
  subscribe(listener: (state: JobState) => void): () => void;
  validateInputs(
    files: readonly File[],
    options: Readonly<Record<string, unknown>>,
  ): Promise<readonly ValidationIssue[]>;
  run(files: readonly File[], options: Readonly<Record<string, unknown>>): Promise<ManagedResult>;
  cancel(): void;
  disposeResult(resultId: string): void;
  dispose(): void;
}

export function createWorkspaceJobRunner(dependencies: {
  capability: CapabilityManifest;
  validator: CapabilityValidator;
  router: EngineRouter;
  results: ResultManager;
  createController: (
    adapter: EngineAdapter<Readonly<Record<string, unknown>>>,
    dispatch: (action: JobAction) => void,
  ) => BrowserJobController;
}): WorkspaceJobRunner {
  const { capability, validator, router, results, createController } = dependencies;
  const listeners = new Set<(state: JobState) => void>();
  let state = INITIAL_JOB_STATE;
  let currentResultId: string | null = null;
  let activeController: BrowserJobController | null = null;

  function dispatch(action: JobAction): void {
    state = jobReducer(state, action);
    for (const fn of listeners) fn(state);
  }

  function resetToIdle(): void {
    // Reset state machine to idle so a new run can begin
    if (state.phase !== "idle") {
      state = INITIAL_JOB_STATE;
    }
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },

    async validateInputs(files, options) {
      return validator.validateCheap(capability, files, options);
    },

    async run(files, options) {
      // Reset to idle if we are in a terminal state
      resetToIdle();

      // Start validation phase
      dispatch({ type: "start-validation" });

      // Cheap validation
      const cheapIssues = await validator.validateCheap(capability, files, options);
      if (cheapIssues.length > 0) {
        const error = normalizeJobError({ code: cheapIssues[0]!.code, phase: "validating" });
        dispatch({ type: "failed", error });
        throw error;
      }

      // Validation passed
      dispatch({ type: "validation-passed" });

      // Load engine
      dispatch({ type: "engine-loading", stageLabel: "Loading engine" });
      const adapter = await router.load(capability.adapterKey);

      // Deep validation
      const deepIssues = await validator.validateWithAdapter(capability, files, options, adapter);
      if (deepIssues.length > 0) {
        const error = normalizeJobError({ code: deepIssues[0]!.code, phase: "validating" });
        dispatch({ type: "failed", error });
        throw error;
      }

      // Dispose prior result
      if (currentResultId) {
        results.dispose(currentResultId);
        currentResultId = null;
      }

      // Create controller and run
      const controller = createController(adapter, dispatch);
      activeController = controller;
      const localResult: LocalWorkerResult = await controller.run({
        capabilityId: capability.id,
        inputs: files,
        options,
      });

      // Create managed result
      const managed = results.create(capability, localResult, files);
      currentResultId = managed.id;

      // Dispatch success with metadata only
      dispatch({ type: "succeeded", result: localResult.metadata });
      activeController = null;

      return managed;
    },

    cancel() {
      if (activeController) activeController.cancel();
    },

    disposeResult(resultId) {
      results.dispose(resultId);
      if (currentResultId === resultId) currentResultId = null;
    },

    dispose() {
      if (activeController) {
        activeController.cancel();
        activeController.dispose();
        activeController = null;
      }
      if (currentResultId) {
        results.dispose(currentResultId);
        currentResultId = null;
      }
      results.disposeAll();
    },
  };
}
