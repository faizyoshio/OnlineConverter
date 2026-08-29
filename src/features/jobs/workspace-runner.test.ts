import { capabilityRegistry } from "@/features/capabilities";
import type { CapabilityManifest } from "@/features/capabilities/schema";
import { ResultManager } from "@/features/results/result-manager";
import { capabilityValidator } from "@/features/validation/capability-validator";
import type { CapabilityValidator } from "@/features/validation/types";
import type { EngineAdapter } from "@/features/workers/adapter";
import type { LocalValuePayload, LocalWorkerResult } from "@/features/workers/protocol";
import { EngineRouter } from "@/features/workers/router";
import { HEADERS } from "@/test/fixtures/headers";
import type { BrowserJobController } from "./controller";
import type { JobAction, JobState } from "./types";
import { createWorkspaceJobRunner } from "./workspace-runner";

function capability(id: string): CapabilityManifest {
  const value = capabilityRegistry.find((item) => item.id === id);
  expect(value).toBeDefined();
  return value!;
}

function fileBytes(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

function adapter(probeResult: Awaited<ReturnType<EngineAdapter<Readonly<Record<string, unknown>>>["probe"]>>) {
  return {
    probe: vi.fn(async () => probeResult),
    validate: vi.fn(async () => []),
    createWorker: vi.fn(),
  } satisfies EngineAdapter<Readonly<Record<string, unknown>>>;
}

function fakeController(result: LocalWorkerResult, dispatch: (action: JobAction) => void): BrowserJobController {
  return {
    run: vi.fn(async () => {
      dispatch({ type: "processing-started", stageLabel: "Processing locally" });
      return result;
    }),
    cancel: vi.fn(),
    dispose: vi.fn(),
  } as unknown as BrowserJobController;
}

function resultManagerHarness() {
  let nextId = 1;
  let nextUrl = 1;
  const createObjectURL = vi.fn(() => "blob:runner-" + nextUrl++);
  const revokeObjectURL = vi.fn();
  return {
    results: new ResultManager({ createId: () => "runner-result-" + nextId++, createObjectURL, revokeObjectURL }),
    createObjectURL,
    revokeObjectURL,
  };
}

test("stops exact cheap mismatches before router, adapter, controller, or worker creation", async () => {
  const manifest = capability("image.compress-png");
  const engine = adapter({ kind: "png", probeRule: "png-signature", bytes: 4 });
  const loader = vi.fn(async () => engine);
  const router = new EngineRouter();
  router.register(manifest.adapterKey, loader);
  const load = vi.spyOn(router, "load");
  const createController = vi.fn();
  const runner = createWorkspaceJobRunner({
    capability: manifest,
    validator: capabilityValidator,
    router,
    results: resultManagerHarness().results,
    createController,
  });
  const file = new File([fileBytes(HEADERS.jpeg)], "picture.png", { type: "image/png" });

  await expect(runner.validateInputs([file], {})).resolves.toEqual(expect.arrayContaining([expect.objectContaining({ code: "unsupported-format" })]));
  await expect(runner.run([file], {})).rejects.toEqual(expect.objectContaining({ code: "unsupported-format" }));
  expect(load).not.toHaveBeenCalled();
  expect(loader).not.toHaveBeenCalled();
  expect(engine.probe).not.toHaveBeenCalled();
  expect(createController).not.toHaveBeenCalled();
  expect(engine.createWorker).not.toHaveBeenCalled();
});

test("loads and probes a candidate but stops before controller creation on deep conflict", async () => {
  const manifest = capability("image.compress-png");
  const file = new File([fileBytes(HEADERS.png)], "picture.png", { type: "image/png" });
  const engine = adapter({ kind: "jpeg", probeRule: "jpeg-soi", bytes: file.size, width: 1, height: 1 });
  const router = new EngineRouter();
  router.register(manifest.adapterKey, async () => engine);
  const createController = vi.fn();
  const runner = createWorkspaceJobRunner({ capability: manifest, validator: capabilityValidator, router, results: resultManagerHarness().results, createController });

  await expect(runner.run([file], {})).rejects.toEqual(expect.objectContaining({ code: "unsupported-format" }));
  expect(engine.probe).toHaveBeenCalledTimes(1);
  expect(createController).not.toHaveBeenCalled();
  expect(engine.createWorker).not.toHaveBeenCalled();
});

test("keeps raw Blobs out of state and public results while replacing URLs exactly once", async () => {
  const manifest = capability("image.compress-png");
  const engine = adapter({ kind: "png", probeRule: "png-signature", bytes: 1, width: 1, height: 1 });
  const router = new EngineRouter();
  router.register(manifest.adapterKey, async () => engine);
  const { results, revokeObjectURL } = resultManagerHarness();
  const rawMarker = "UNIQUE_RAW_BLOB_MARKER";
  const outputs = [
    new Blob([rawMarker + "-1"], { type: "image/png" }),
    new Blob([rawMarker + "-2"], { type: "image/png" }),
  ];
  let resultIndex = 0;
  const createController = vi.fn((_adapter, dispatch: (action: JobAction) => void) => {
    const blob = outputs[resultIndex++]!;
    return fakeController({
      mode: "files",
      outputs: [{ blob }],
      metadata: { resultMode: "files", outputMimeTypes: [blob.type], outputBytes: [blob.size] },
    }, dispatch);
  });
  const validator: CapabilityValidator = {
    validateCheap: vi.fn(async () => []),
    validateWithAdapter: vi.fn(async () => []),
  };
  const states: JobState[] = [];
  const runner = createWorkspaceJobRunner({ capability: manifest, validator, router, results, createController });
  runner.subscribe((state) => states.push(state));

  const first = await runner.run([], {});
  expect(first.mode).toBe("files");
  expect(JSON.stringify(first)).not.toContain(rawMarker);
  expect(JSON.stringify(states)).not.toContain(rawMarker);
  expect(states.some((state) => Object.values(state).some((value) => value instanceof Blob))).toBe(false);
  expect(revokeObjectURL).not.toHaveBeenCalled();

  const second = await runner.run([], {});
  expect(revokeObjectURL).toHaveBeenCalledTimes(1);
  expect(revokeObjectURL).toHaveBeenCalledWith("blob:runner-1");
  runner.dispose();
  expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  expect(revokeObjectURL).toHaveBeenLastCalledWith("blob:runner-2");
  expect(second.id).not.toBe(first.id);
});

test.each([
  ["utility.unit", { kind: "number", display: "1 m", numericValue: 1, unit: "m" } satisfies LocalValuePayload],
  ["utility.time", { kind: "time", display: "12:00", iso: "2026-08-28T12:00:00Z", zone: "UTC", utcOffset: "+00:00" } satisfies LocalValuePayload],
  ["utility.password", { kind: "password", value: "LOCAL_PASSWORD_VALUE" } satisfies LocalValuePayload],
  ["image.color-picker", { kind: "color", hex: "#ffffff", rgb: "255 255 255", hsl: "0 0% 100%" } satisfies LocalValuePayload],
  ["image.color-extractor", { kind: "palette", colors: [{ hex: "#ffffff", proportion: 1 }] } satisfies LocalValuePayload],
])("returns %s value results without placing values in JobState", async (id, value) => {
  const manifest = capability(id);
  const engine = adapter({ kind: "unknown", probeRule: "unknown", bytes: 0 });
  const router = new EngineRouter();
  router.register(manifest.adapterKey, async () => engine);
  const { results, createObjectURL } = resultManagerHarness();
  const validator: CapabilityValidator = { validateCheap: vi.fn(async () => []), validateWithAdapter: vi.fn(async () => []) };
  const states: JobState[] = [];
  const runner = createWorkspaceJobRunner({
    capability: manifest,
    validator,
    router,
    results,
    createController: (_adapter, dispatch) => fakeController({
      mode: "value",
      value,
      metadata: { resultMode: "value", outputMimeTypes: [], outputBytes: [] },
    }, dispatch),
  });
  runner.subscribe((state) => states.push(state));
  const managed = await runner.run([], Object.fromEntries(manifest.optionFields.map((field) => [field.key, field.defaultValue])));
  expect(managed).toEqual(expect.objectContaining({ mode: "value", value }));
  expect(createObjectURL).not.toHaveBeenCalled();
  expect(JSON.stringify(states)).not.toContain(JSON.stringify(value));
  runner.disposeResult(managed.id);
  expect((results as unknown as { entries: Map<string, unknown> }).entries.size).toBe(0);
});

test("preserves a sanitized selected-entry basename and creates a local URL", async () => {
  const manifest = capability("archive.zip-extract");
  const engine = adapter({ kind: "zip", probeRule: "zip-header", bytes: 4, expandedBytes: 4, archiveEntries: 1, archiveDepth: 1 });
  const router = new EngineRouter();
  router.register(manifest.adapterKey, async () => engine);
  const { results, createObjectURL } = resultManagerHarness();
  const blob = new Blob(["entry"], { type: "text/plain" });
  const validator: CapabilityValidator = { validateCheap: vi.fn(async () => []), validateWithAdapter: vi.fn(async () => []) };
  const runner = createWorkspaceJobRunner({
    capability: manifest,
    validator,
    router,
    results,
    createController: (_adapter, dispatch) => fakeController({
      mode: "selected-entries",
      outputs: [{ blob, suggestedDownloadName: "folder/report.txt" }],
      metadata: { resultMode: "selected-entries", outputMimeTypes: [blob.type], outputBytes: [blob.size] },
    }, dispatch),
  });
  const managed = await runner.run([], {});
  if (managed.mode !== "selected-entries") throw new Error("Unexpected mode");
  expect(managed.outputs[0]?.downloadName).toBe("report.txt");
  expect(createObjectURL).toHaveBeenCalledTimes(1);
});
