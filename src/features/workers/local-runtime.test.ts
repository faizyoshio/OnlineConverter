import { describe, expect, test, vi } from "vitest";
import type { LocalWorkerResult, WorkerResponse } from "./protocol";
import { LocalWorkerRuntime } from "./local-runtime";

const result: LocalWorkerResult = {
  mode: "files",
  outputs: [{ blob: new Blob(["pdf"], { type: "application/pdf" }), suggestedDownloadName: "merged.pdf" }],
  metadata: { resultMode: "files", outputMimeTypes: ["application/pdf"], outputBytes: [3], pages: 1 },
};

describe("LocalWorkerRuntime", () => {
  test("acknowledges initialization then returns a local operation result", async () => {
    const responses: WorkerResponse[] = [];
    const operation = vi.fn(async ({ reportProgress }) => {
      reportProgress(0.5, "Merging pages");
      return result;
    });
    const runtime = new LocalWorkerRuntime((response) => responses.push(response), operation);

    await runtime.handle({ type: "initialize", jobId: "job-1", capabilityId: "pdf.merge" });
    await runtime.handle({ type: "process", jobId: "job-1", inputs: [], options: {} });

    expect(operation).toHaveBeenCalledWith(expect.objectContaining({
      capabilityId: "pdf.merge",
      jobId: "job-1",
      inputs: [],
      options: {},
    }));
    expect(responses).toEqual([
      { type: "ready", jobId: "job-1" },
      { type: "progress", jobId: "job-1", value: 0.5, stageLabel: "Merging pages" },
      { type: "result", jobId: "job-1", result },
    ]);
  });

  test("cancels an in-flight operation and suppresses its late result", async () => {
    const responses: WorkerResponse[] = [];
    let finish: ((value: LocalWorkerResult) => void) | undefined;
    const operation = vi.fn(() => new Promise<LocalWorkerResult>((resolve) => { finish = resolve; }));
    const runtime = new LocalWorkerRuntime((response) => responses.push(response), operation);

    await runtime.handle({ type: "initialize", jobId: "job-1", capabilityId: "pdf.merge" });
    const processing = runtime.handle({ type: "process", jobId: "job-1", inputs: [], options: {} });
    await Promise.resolve();
    await runtime.handle({ type: "cancel", jobId: "job-1" });
    finish?.(result);
    await processing;

    expect(responses).toEqual([
      { type: "ready", jobId: "job-1" },
      { type: "cancelled", jobId: "job-1" },
    ]);
  });

  test("reports a sanitized failure and disposes job state", async () => {
    const responses: WorkerResponse[] = [];
    const runtime = new LocalWorkerRuntime((response) => responses.push(response), async () => {
      throw new Error("private parser detail");
    });

    await runtime.handle({ type: "initialize", jobId: "job-1", capabilityId: "pdf.merge" });
    await runtime.handle({ type: "process", jobId: "job-1", inputs: [], options: {} });
    await runtime.handle({ type: "dispose", jobId: "job-1" });

    expect(responses).toEqual([
      { type: "ready", jobId: "job-1" },
      { type: "failure", jobId: "job-1", code: "conversion-failed" },
      { type: "disposed", jobId: "job-1" },
    ]);
  });
});