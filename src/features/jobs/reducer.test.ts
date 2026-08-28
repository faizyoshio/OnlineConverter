import { INITIAL_JOB_STATE, jobReducer } from "./reducer";
import type { JobResultMetadata, JobState, NormalizedJobError } from "./types";

const result: JobResultMetadata = {
  resultMode: "files",
  outputMimeTypes: ["application/pdf"],
  outputBytes: [1024],
  pages: 1,
};

const failure: NormalizedJobError = {
  code: "conversion-failed",
  publicMessage: "The local conversion could not be completed.",
  retryable: true,
  phase: "processing",
};

function reduce(actions: Parameters<typeof jobReducer>[1][], state: JobState = INITIAL_JOB_STATE) {
  return actions.reduce(jobReducer, state);
}

test("runs the complete happy path", () => {
  const state = reduce([
    { type: "start-validation" },
    { type: "validation-passed" },
    { type: "engine-loading", stageLabel: "Loading PDF engine" },
    { type: "progress", value: null, stageLabel: "Loading PDF engine" },
    { type: "processing-started", stageLabel: "Processing locally" },
    { type: "progress", value: 1.4, stageLabel: "Finishing" },
    { type: "succeeded", result },
  ]);

  expect(state).toEqual({
    phase: "success",
    progress: 1,
    stageLabel: "Complete",
    warnings: [],
    error: null,
    result,
  });
});

test("enters success-with-warnings and de-duplicates warning codes", () => {
  const state = reduce([
    { type: "start-validation" },
    { type: "validation-passed" },
    { type: "engine-loading", stageLabel: "Loading" },
    { type: "warning", code: "lossy-output" },
    { type: "warning", code: "lossy-output" },
    { type: "processing-started", stageLabel: "Processing" },
    { type: "succeeded", result },
  ]);
  expect(state.phase).toBe("success-with-warnings");
  expect(state.warnings).toEqual(["lossy-output"]);
});

test("records a validation failure with no raw result", () => {
  const state = reduce([{ type: "start-validation" }, { type: "failed", error: { ...failure, phase: "validating" } }]);
  expect(state).toEqual(expect.objectContaining({ phase: "failure", error: expect.objectContaining({ phase: "validating" }), result: null }));
});

test("supports cooperative and hard cancellation", () => {
  const cooperative = reduce([
    { type: "start-validation" },
    { type: "validation-passed" },
    { type: "engine-loading", stageLabel: "Loading" },
    { type: "processing-started", stageLabel: "Processing" },
    { type: "cancelled" },
  ]);
  expect(cooperative).toEqual(expect.objectContaining({ phase: "cancelled", error: expect.objectContaining({ code: "cancelled", phase: "processing" }) }));

  const hard = reduce([
    { type: "start-validation" },
    { type: "validation-passed" },
    { type: "engine-loading", stageLabel: "Loading" },
    { type: "cancelled" },
  ]);
  expect(hard).toEqual(expect.objectContaining({ phase: "cancelled", error: expect.objectContaining({ code: "cancelled", phase: "loading-engine" }) }));
});

test("retries a failure by returning to validation", () => {
  const state = reduce([
    { type: "start-validation" },
    { type: "failed", error: { ...failure, phase: "validating" } },
    { type: "start-validation" },
  ]);
  expect(state).toEqual({ ...INITIAL_JOB_STATE, phase: "validating" });
});

test("cleans every terminal state before returning to idle", () => {
  for (const terminal of [
    reduce([{ type: "start-validation" }, { type: "failed", error: failure }]),
    reduce([{ type: "start-validation" }, { type: "cancelled" }]),
    reduce([
      { type: "start-validation" }, { type: "validation-passed" }, { type: "engine-loading", stageLabel: "Loading" },
      { type: "processing-started", stageLabel: "Processing" }, { type: "succeeded", result },
    ]),
  ]) {
    const cleaned = reduce([{ type: "cleanup-started" }, { type: "cleaned" }], terminal);
    expect(cleaned).toEqual(INITIAL_JOB_STATE);
  }
});

test("rejects impossible transitions in test and development", () => {
  expect(() => jobReducer(INITIAL_JOB_STATE, { type: "succeeded", result })).toThrow(/invalid job transition/i);
  expect(() => jobReducer(INITIAL_JOB_STATE, { type: "progress", value: 0.5, stageLabel: "Impossible" })).toThrow(/invalid job transition/i);
});
