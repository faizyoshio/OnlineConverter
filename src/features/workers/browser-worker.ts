import type { WorkerLike, WorkerMessageListener } from "./adapter";
import type { WorkerRequest } from "./protocol";

export class BrowserWorkerBridge implements WorkerLike {
  constructor(private readonly worker: Worker) {}

  postMessage(message: WorkerRequest): void {
    this.worker.postMessage(message);
  }

  addEventListener(type: "message", listener: WorkerMessageListener): void {
    this.worker.addEventListener(type, listener as EventListener);
  }

  removeEventListener(type: "message", listener: WorkerMessageListener): void {
    this.worker.removeEventListener(type, listener as EventListener);
  }

  terminate(): void {
    this.worker.terminate();
  }
}
