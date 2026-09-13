import { afterEach, describe, expect, test, vi } from "vitest";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";
import { createImageAdapter } from "./adapter";

class NativeWorkerDouble {
  static latest: NativeWorkerDouble | undefined;
  constructor(readonly url: URL, readonly options: WorkerOptions) { NativeWorkerDouble.latest = this; }
  postMessage(): void {}
  addEventListener(): void {}
  removeEventListener(): void {}
  terminate(): void {}
}

afterEach(() => vi.unstubAllGlobals());

describe("image codec adapter", () => {
  test("reports malformed options before work starts", async () => {
    const adapter = createImageAdapter("image.jpg-to-modern");
    await expect(adapter.validate([], {})).resolves.toEqual([
      expect.objectContaining({ code: "malformed-input", field: "options" }),
    ]);
    await expect(adapter.validate([], { target: "png" })).resolves.toEqual([]);
  });

  test("uses a module browser worker", () => {
    vi.stubGlobal("Worker", NativeWorkerDouble);
    const worker = createImageAdapter("image.webp-to-png").createWorker();
    expect(worker).toBeInstanceOf(BrowserWorkerBridge);
    expect(NativeWorkerDouble.latest).toEqual(expect.objectContaining({ options: { type: "module" } }));
    expect(NativeWorkerDouble.latest?.url.pathname).toMatch(/image\.worker\.ts$/);
    worker.terminate();
  });
});
