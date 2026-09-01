import { afterEach, describe, expect, test, vi } from "vitest";
import { createZip } from "@/engines/utility/operations";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";
import { createArchiveAdapter } from "./adapter";

class NativeWorkerDouble {
  static latest: NativeWorkerDouble | undefined;
  constructor(readonly url: URL, readonly options: WorkerOptions) { NativeWorkerDouble.latest = this; }
  postMessage(): void {}
  addEventListener(): void {}
  removeEventListener(): void {}
  terminate(): void {}
}

afterEach(() => vi.unstubAllGlobals());

describe("archive adapter", () => {
  test("probes actual opaque and ZIP metadata", async () => {
    const createProbe = await createArchiveAdapter("archive.zip-create").probe(new File(["abc"], "a.txt"));
    expect(createProbe).toEqual({ kind: "binary", probeRule: "opaque-local-file", bytes: 3 });

    const bytes = await createZip([{ name: "nested/a.txt", bytes: new TextEncoder().encode("abc") }]);
    const extractProbe = await createArchiveAdapter("archive.zip-extract").probe(new File([Uint8Array.from(bytes)], "a.zip", { type: "application/zip" }));
    expect(extractProbe).toEqual({ kind: "zip", probeRule: "zip-header", bytes: bytes.length, expandedBytes: 3, archiveEntries: 1, archiveDepth: 2 });
  });

  test("returns a normalized issue for corrupt ZIP input", async () => {
    const adapter = createArchiveAdapter("archive.zip-extract");
    const issues = await adapter.validate([new File(["not a zip"], "broken.zip", { type: "application/zip" })], {});
    expect(issues).toEqual([{ code: "malformed-input", field: "files[0]", message: "The local ZIP archive is malformed or unsafe." }]);
  });

  test.each(["archive.zip-create", "archive.zip-extract"] as const)("%s uses a module browser worker", (capabilityId) => {
    vi.stubGlobal("Worker", NativeWorkerDouble);
    const worker = createArchiveAdapter(capabilityId).createWorker();
    expect(worker).toBeInstanceOf(BrowserWorkerBridge);
    expect(NativeWorkerDouble.latest?.options).toEqual({ type: "module" });
  });
});
