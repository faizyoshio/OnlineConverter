import { normalizeJobError } from "./errors";
import type { JobAction, JobPhase, NormalizedJobError } from "./types";
import type { EngineAdapter, WorkerMessageListener } from "@/features/workers/adapter";
import type { LocalWorkerResult, WorkerResponse } from "@/features/workers/protocol";

type RunRequest = {
  capabilityId: string;
  inputs: readonly File[];
  options: Readonly<Record<string, unknown>>;
};

type ActiveRun = {
  jobId: string;
  request: RunRequest;
  resolve: (result: LocalWorkerResult) => void;
  reject: (error: NormalizedJobError) => void;
  phase: Extract<JobPhase, "loading-engine" | "processing">;
  processingStarted: boolean;
};

type ControllerOptions = {
  cancellationTimeoutMs?: number;
  createJobId?: () => string;
};

export class BrowserJobController {
  private readonly worker;
  private readonly listener: WorkerMessageListener;
  private readonly cancellationTimeoutMs: number;
  private readonly createJobId: () => string;
  private active: ActiveRun | null = null;
  private cancellationTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;

  constructor(
    adapter: EngineAdapter<Readonly<Record<string, unknown>>>,
    private readonly dispatch: (action: JobAction) => void,
    options: ControllerOptions = {},
  ) {
    this.worker = adapter.createWorker();
    this.cancellationTimeoutMs = options.cancellationTimeoutMs ?? 1000;
    this.createJobId = options.createJobId ?? (() => crypto.randomUUID());
    this.listener = (event) => this.handleMessage(event.data);
    this.worker.addEventListener("message", this.listener);
  }

  run(request: RunRequest): Promise<LocalWorkerResult> {
    if (this.disposed || this.active) {
      return Promise.reject(normalizeJobError({ code: "conversion-failed", phase: "processing" }));
    }
    const jobId = this.createJobId();
    this.dispatch({ type: "engine-loading", stageLabel: "Loading local engine" });
    return new Promise<LocalWorkerResult>((resolve, reject) => {
      this.active = {
        jobId,
        request,
        resolve,
        reject,
        phase: "loading-engine",
        processingStarted: false,
      };
      this.worker.postMessage({ type: "initialize", jobId, capabilityId: request.capabilityId });
    });
  }

  cancel(): void {
    const active = this.active;
    if (!active || this.cancellationTimer) return;
    this.worker.postMessage({ type: "cancel", jobId: active.jobId });
    this.dispatch({ type: "progress", value: null, stageLabel: "Cancelling" });
    this.cancellationTimer = setTimeout(() => {
      if (this.active?.jobId === active.jobId) this.finishCancelled(active);
    }, this.cancellationTimeoutMs);
  }

  dispose(): void {
    if (this.disposed) return;
    const active = this.active;
    if (active) {
      this.finishCancelled(active);
      return;
    }
    this.worker.removeEventListener("message", this.listener);
    this.worker.terminate();
    this.disposed = true;
  }

  private handleMessage(response: WorkerResponse): void {
    const active = this.active;
    if (!active || response.jobId !== active.jobId) return;
    switch (response.type) {
      case "ready":
        if (active.processingStarted) return;
        active.processingStarted = true;
        active.phase = "processing";
        this.dispatch({ type: "processing-started", stageLabel: "Processing locally" });
        this.worker.postMessage({
          type: "process",
          jobId: active.jobId,
          inputs: active.request.inputs,
          options: active.request.options,
        });
        return;
      case "progress":
        this.dispatch({ type: "progress", value: response.value, stageLabel: response.stageLabel });
        return;
      case "warning":
        this.dispatch({ type: "warning", code: response.code });
        return;
      case "result":
        this.finishResolved(active, response.result);
        return;
      case "failure":
        this.finishRejected(active, normalizeJobError({ code: response.code, phase: active.phase }, active.phase));
        return;
      case "cancelled":
        this.finishCancelled(active);
        return;
      case "disposed":
        return;
    }
  }

  private finishResolved(active: ActiveRun, result: LocalWorkerResult): void {
    if (this.active !== active) return;
    this.active = null;
    this.clearCancellationTimer();
    active.resolve(result);
    this.teardown(active.jobId);
  }

  private finishRejected(active: ActiveRun, error: NormalizedJobError): void {
    if (this.active !== active) return;
    this.active = null;
    this.clearCancellationTimer();
    this.dispatch({ type: "failed", error });
    active.reject(error);
    this.teardown(active.jobId);
  }

  private finishCancelled(active: ActiveRun): void {
    if (this.active !== active) return;
    const error = normalizeJobError({ code: "cancelled", phase: active.phase }, active.phase);
    this.active = null;
    this.clearCancellationTimer();
    this.dispatch({ type: "cancelled" });
    active.reject(error);
    this.teardown(active.jobId);
  }

  private clearCancellationTimer(): void {
    if (this.cancellationTimer) clearTimeout(this.cancellationTimer);
    this.cancellationTimer = null;
  }

  private teardown(jobId: string): void {
    if (this.disposed) return;
    this.worker.postMessage({ type: "dispose", jobId });
    this.worker.removeEventListener("message", this.listener);
    this.worker.terminate();
    this.disposed = true;
  }
}
