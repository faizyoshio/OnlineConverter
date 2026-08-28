import type { JobAction } from "./types";
import { BrowserJobController } from "./controller";
import type { EngineAdapter } from "@/features/workers/adapter";
import type { LocalWorkerResult } from "@/features/workers/protocol";
import { FakeWorker } from "@/test/fakes/fake-worker";

const localResult: LocalWorkerResult = {
  mode: "files",
  outputs: [{ blob: new Blob(["done"], { type: "application/pdf" }) }],
  metadata: { resultMode: "files", outputMimeTypes: ["application/pdf"], outputBytes: [4], pages: 1 },
};

function harness(timeout = 250) {
  const worker = new FakeWorker();
  const actions: JobAction[] = [];
  const adapter: EngineAdapter<Readonly<Record<string, unknown>>> = {
    probe: vi.fn(),
    validate: vi.fn(),
    createWorker: () => worker,
  };
  const controller = new BrowserJobController(adapter, (action) => actions.push(action), {
    cancellationTimeoutMs: timeout,
    createJobId: () => "job-current",
  });
  return { worker, actions, controller };
}

test("dispatches loading before processing and resolves one local result", async () => {
  const { worker, actions, controller } = harness();
  const promise = controller.run({ capabilityId: "pdf.merge", inputs: [], options: {} });
  expect(actions[0]).toEqual({ type: "engine-loading", stageLabel: "Loading local engine" });
  expect(worker.posted[0]).toEqual({ type: "initialize", jobId: "job-current", capabilityId: "pdf.merge" });

  worker.emit({ type: "ready", jobId: "job-current" });
  expect(actions[1]).toEqual({ type: "processing-started", stageLabel: "Processing locally" });
  expect(worker.posted[1]).toEqual({ type: "process", jobId: "job-current", inputs: [], options: {} });

  worker.emit({ type: "progress", jobId: "stale-job", value: 0.9, stageLabel: "Ignore me" });
  worker.emit({ type: "progress", jobId: "job-current", value: null, stageLabel: "Preparing pages" });
  worker.emit({ type: "progress", jobId: "job-current", value: 0.5, stageLabel: "Converting" });
  worker.emit({ type: "warning", jobId: "job-current", code: "lossy-output" });
  expect(actions).toEqual(expect.arrayContaining([
    { type: "progress", value: null, stageLabel: "Preparing pages" },
    { type: "progress", value: 0.5, stageLabel: "Converting" },
    { type: "warning", code: "lossy-output" },
  ]));
  expect(actions).not.toContainEqual(expect.objectContaining({ stageLabel: "Ignore me" }));

  worker.emit({ type: "result", jobId: "job-current", result: localResult });
  worker.emit({ type: "result", jobId: "job-current", result: localResult });
  await expect(promise).resolves.toBe(localResult);
  expect(worker.posted).toContainEqual({ type: "dispose", jobId: "job-current" });
  expect(worker.terminated).toBe(true);
  expect(worker.listeners.size).toBe(0);
  expect(actions.some((action) => action.type === "succeeded")).toBe(false);
});

test("posts cooperative cancel and accepts a cancelled response", async () => {
  const { worker, actions, controller } = harness();
  const promise = controller.run({ capabilityId: "pdf.merge", inputs: [], options: {} });
  const rejection = expect(promise).rejects.toEqual(expect.objectContaining({ code: "cancelled" }));
  worker.emit({ type: "ready", jobId: "job-current" });
  controller.cancel();
  expect(worker.posted).toContainEqual({ type: "cancel", jobId: "job-current" });
  expect(actions).toContainEqual({ type: "progress", value: null, stageLabel: "Cancelling" });
  worker.emit({ type: "cancelled", jobId: "job-current" });
  await rejection;
  expect(actions.at(-1)).toEqual({ type: "cancelled" });
  expect(worker.terminated).toBe(true);
});

test("terminates when cooperative cancellation times out", async () => {
  vi.useFakeTimers();
  const { worker, actions, controller } = harness(250);
  const promise = controller.run({ capabilityId: "pdf.merge", inputs: [], options: {} });
  const rejection = expect(promise).rejects.toEqual(expect.objectContaining({ code: "cancelled" }));
  worker.emit({ type: "ready", jobId: "job-current" });
  controller.cancel();
  await vi.advanceTimersByTimeAsync(250);
  await rejection;
  expect(worker.terminated).toBe(true);
  expect(actions.at(-1)).toEqual({ type: "cancelled" });
  vi.useRealTimers();
});

test("rejects concurrent runs with a fixed normalized error", async () => {
  const { worker, controller } = harness();
  const first = controller.run({ capabilityId: "pdf.merge", inputs: [], options: {} });
  await expect(controller.run({ capabilityId: "pdf.merge", inputs: [], options: {} })).rejects.toEqual(
    expect.objectContaining({ code: "conversion-failed", phase: "processing" }),
  );
  worker.emit({ type: "result", jobId: "job-current", result: localResult });
  await first;
});

test("dispose removes listeners and terminates the owned worker", () => {
  const { worker, controller } = harness();
  expect(worker.listeners.size).toBe(1);
  controller.dispose();
  expect(worker.listeners.size).toBe(0);
  expect(worker.terminated).toBe(true);
});
