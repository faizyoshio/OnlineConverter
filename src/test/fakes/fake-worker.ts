import type { WorkerLike, WorkerMessageListener } from "@/features/workers/adapter";
import type { WorkerRequest, WorkerResponse } from "@/features/workers/protocol";

export class FakeWorker implements WorkerLike {
  readonly posted: WorkerRequest[] = [];
  readonly listeners = new Set<WorkerMessageListener>();
  terminated = false;

  postMessage(message: WorkerRequest): void {
    this.posted.push(message);
  }

  addEventListener(type: "message", listener: WorkerMessageListener): void {
    if (type === "message") this.listeners.add(listener);
  }

  removeEventListener(type: "message", listener: WorkerMessageListener): void {
    if (type === "message") this.listeners.delete(listener);
  }

  terminate(): void {
    this.terminated = true;
  }

  emit(response: WorkerResponse): void {
    const event = new MessageEvent<WorkerResponse>("message", { data: response });
    for (const listener of [...this.listeners]) listener(event);
  }
}
