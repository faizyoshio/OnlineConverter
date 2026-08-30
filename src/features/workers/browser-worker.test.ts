import { afterEach, describe, expect, test, vi } from "vitest";
import type { WorkerRequest, WorkerResponse } from "./protocol";
import { BrowserWorkerBridge } from "./browser-worker";

class NativeWorkerDouble {
  static latest: NativeWorkerDouble | undefined;

  readonly messages: unknown[] = [];
  readonly listeners = new Set<(event: MessageEvent<WorkerResponse>) => void>();
  terminated = false;

  constructor(readonly url: URL, readonly options: WorkerOptions) {
    NativeWorkerDouble.latest = this;
  }

  postMessage(message: unknown): void {
    this.messages.push(message);
  }

  addEventListener(type: string, listener: (event: MessageEvent<WorkerResponse>) => void): void {
    if (type === "message") this.listeners.add(listener);
  }

  removeEventListener(type: string, listener: (event: MessageEvent<WorkerResponse>) => void): void {
    if (type === "message") this.listeners.delete(listener);
  }

  terminate(): void {
    this.terminated = true;
  }

  emit(response: WorkerResponse): void {
    const event = new MessageEvent<WorkerResponse>("message", { data: response });
    for (const listener of this.listeners) listener(event);
  }
}

afterEach(() => vi.unstubAllGlobals());

describe("BrowserWorkerBridge", () => {
  test("forwards local protocol messages through a module worker", () => {
    vi.stubGlobal("Worker", NativeWorkerDouble);
    const nativeWorker = new Worker(new URL("https://example.test/pdf.worker.ts"), { type: "module" });
    const bridge = new BrowserWorkerBridge(nativeWorker);
    const listener = vi.fn();
    const request: WorkerRequest = { type: "initialize", jobId: "job-1", capabilityId: "pdf.merge" };

    bridge.addEventListener("message", listener);
    bridge.postMessage(request);
    NativeWorkerDouble.latest?.emit({ type: "ready", jobId: "job-1" });
    bridge.removeEventListener("message", listener);
    bridge.terminate();

    expect(NativeWorkerDouble.latest).toEqual(expect.objectContaining({
      url: new URL("https://example.test/pdf.worker.ts"),
      options: { type: "module" },
      messages: [request],
      terminated: true,
    }));
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ data: { type: "ready", jobId: "job-1" } }));
    expect(NativeWorkerDouble.latest?.listeners.size).toBe(0);
  });
});
