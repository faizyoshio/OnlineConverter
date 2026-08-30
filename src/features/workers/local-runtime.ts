import type { LocalWorkerResult, WorkerRequest, WorkerResponse } from "./protocol";

export type LocalWorkerOperationContext = {
  capabilityId: string;
  jobId: string;
  inputs: readonly File[];
  options: Readonly<Record<string, unknown>>;
  isCancelled: () => boolean;
  reportProgress: (value: number | null, stageLabel: string) => void;
};

export type LocalWorkerOperation = (context: LocalWorkerOperationContext) => Promise<LocalWorkerResult>;

type ActiveJob = {
  capabilityId: string;
  cancelled: boolean;
  cancelledReported: boolean;
  processing: boolean;
};

export class LocalWorkerRuntime {
  private readonly jobs = new Map<string, ActiveJob>();

  constructor(
    private readonly emit: (response: WorkerResponse) => void,
    private readonly operation: LocalWorkerOperation,
  ) {}

  async handle(request: WorkerRequest): Promise<void> {
    if (request.type === "initialize") {
      this.jobs.set(request.jobId, { capabilityId: request.capabilityId, cancelled: false, cancelledReported: false, processing: false });
      this.emit({ type: "ready", jobId: request.jobId });
      return;
    }

    if (request.type === "cancel") {
      const job = this.jobs.get(request.jobId);
      if (job) {
        job.cancelled = true;
        this.emitCancelled(request.jobId, job);
      }
      return;
    }

    if (request.type === "dispose") {
      this.jobs.delete(request.jobId);
      this.emit({ type: "disposed", jobId: request.jobId });
      return;
    }

    await this.process(request);
  }

  private async process(request: Extract<WorkerRequest, { type: "process" }>): Promise<void> {
    const job = this.jobs.get(request.jobId);
    if (!job) {
      this.emit({ type: "failure", jobId: request.jobId, code: "conversion-failed" });
      return;
    }
    if (job.cancelled) {
      this.emitCancelled(request.jobId, job);
      return;
    }

    job.processing = true;
    try {
      const result = await this.operation({
        capabilityId: job.capabilityId,
        jobId: request.jobId,
        inputs: request.inputs,
        options: request.options,
        isCancelled: () => job.cancelled,
        reportProgress: (value, stageLabel) => {
          if (!job.cancelled && this.jobs.get(request.jobId) === job) {
            this.emit({ type: "progress", jobId: request.jobId, value, stageLabel });
          }
        },
      });
      if (job.cancelled) {
        this.emitCancelled(request.jobId, job);
      } else if (this.jobs.get(request.jobId) === job) {
        this.emit({ type: "result", jobId: request.jobId, result });
      }
    } catch {
      if (job.cancelled) {
        this.emitCancelled(request.jobId, job);
      } else if (this.jobs.get(request.jobId) === job) {
        this.emit({ type: "failure", jobId: request.jobId, code: "conversion-failed" });
      }
    } finally {
      job.processing = false;
      if (this.jobs.get(request.jobId) === job) this.jobs.delete(request.jobId);
    }
  }

  private emitCancelled(jobId: string, job: ActiveJob): void {
    if (job.cancelledReported) return;
    job.cancelledReported = true;
    this.emit({ type: "cancelled", jobId });
  }
}