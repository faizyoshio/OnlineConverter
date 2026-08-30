import { afterEach, describe, expect, test, vi } from "vitest";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";
import { createPdfMergeAdapter } from "./pdf-merge";
import { createPdfSplitAdapter } from "./pdf-split";

class NativeWorkerDouble {
  static latest: NativeWorkerDouble | undefined;

  terminated = false;

  constructor(readonly url: URL, readonly options: WorkerOptions) {
    NativeWorkerDouble.latest = this;
  }

  postMessage(): void {}

  addEventListener(): void {}

  removeEventListener(): void {}

  terminate(): void {
    this.terminated = true;
  }
}

afterEach(() => vi.unstubAllGlobals());

describe("PDF worker adapters", () => {
  test.each([
    ["merge", createPdfMergeAdapter],
    ["split", createPdfSplitAdapter],
  ])("%s uses a module browser worker", (_name, createAdapter) => {
    vi.stubGlobal("Worker", NativeWorkerDouble);

    const worker = createAdapter().createWorker();

    expect(worker).toBeInstanceOf(BrowserWorkerBridge);
    expect(NativeWorkerDouble.latest).toEqual(expect.objectContaining({ options: { type: "module" } }));
    worker.terminate();
  });
});
