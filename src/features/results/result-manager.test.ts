import { capabilityRegistry } from "@/features/capabilities";
import type { CapabilityManifest } from "@/features/capabilities/schema";
import type { LocalValuePayload, LocalWorkerResult } from "@/features/workers/protocol";
import { ResultManager } from "./result-manager";

function capability(id: string): CapabilityManifest {
  const value = capabilityRegistry.find((item) => item.id === id);
  expect(value).toBeDefined();
  return value!;
}

function fileResult(blob: Blob, overrides: Partial<LocalWorkerResult["metadata"]> = {}): LocalWorkerResult {
  return {
    mode: "files",
    outputs: [{ blob }],
    metadata: {
      resultMode: "files",
      outputMimeTypes: [blob.type],
      outputBytes: [blob.size],
      ...overrides,
    },
  };
}

function selectedResult(blob: Blob, suggestedDownloadName?: string): LocalWorkerResult {
  return {
    mode: "selected-entries",
    outputs: [{ blob, ...(suggestedDownloadName === undefined ? {} : { suggestedDownloadName }) }],
    metadata: { resultMode: "selected-entries", outputMimeTypes: [blob.type], outputBytes: [blob.size] },
  };
}

function valueResult(value: LocalValuePayload): LocalWorkerResult {
  return { mode: "value", value, metadata: { resultMode: "value", outputMimeTypes: [], outputBytes: [] } };
}

function managerHarness() {
  let nextId = 1;
  let nextUrl = 1;
  const createObjectURL = vi.fn(() => "blob:managed-" + nextUrl++);
  const revokeObjectURL = vi.fn();
  const manager = new ResultManager({
    createId: () => "result-" + nextId++,
    createObjectURL,
    revokeObjectURL,
  });
  return { manager, createObjectURL, revokeObjectURL };
}

test("creates one managed URL per output with generated labels", () => {
  const { manager, createObjectURL } = managerHarness();
  const blob = new Blob(["RAW_BLOB_MARKER"], { type: "application/pdf" });
  const managed = manager.create(capability("pdf.merge"), fileResult(blob));

  expect(managed).toEqual({
    id: "result-1",
    mode: "files",
    outputs: [{ url: "blob:managed-1", mimeType: "application/pdf", bytes: blob.size, downloadName: "output-1.pdf" }],
    metadata: { resultMode: "files", outputMimeTypes: ["application/pdf"], outputBytes: [blob.size] },
  });
  expect(createObjectURL).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(managed)).not.toContain("RAW_BLOB_MARKER");
});

test("revokes each URL exactly once across repeated disposal and disposeAll", () => {
  const { manager, revokeObjectURL } = managerHarness();
  const first = manager.create(capability("pdf.merge"), fileResult(new Blob(["one"], { type: "application/pdf" })));
  const second = manager.create(capability("pdf.merge"), fileResult(new Blob(["two"], { type: "application/pdf" })));

  manager.dispose(first.id);
  manager.dispose(first.id);
  expect(revokeObjectURL).toHaveBeenCalledTimes(1);
  manager.disposeAll();
  manager.disposeAll();
  expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  expect(revokeObjectURL).toHaveBeenNthCalledWith(1, "blob:managed-1");
  expect(revokeObjectURL).toHaveBeenNthCalledWith(2, "blob:managed-2");
  expect(second.id).toBe("result-2");
});

test("sanitizes archive entry suggestions to a safe basename", () => {
  const { manager } = managerHarness();
  const blob = new Blob(["report"], { type: "text/plain" });
  const managed = manager.create(capability("archive.zip-extract"), selectedResult(blob, "folder/report.txt"));
  expect(managed.mode).toBe("selected-entries");
  if (managed.mode !== "selected-entries") throw new Error("Unexpected mode");
  expect(managed.outputs[0]?.downloadName).toBe("report.txt");
});

test.each([
  "C:\\report.txt",
  "../report.txt",
  "bad\u0000.txt",
  "",
  "CON.txt",
  "a".repeat(121) + ".txt",
])("falls back for an unsafe archive name", (name) => {
  const { manager } = managerHarness();
  const blob = new Blob(["report"], { type: "text/plain" });
  const managed = manager.create(capability("archive.zip-extract"), selectedResult(blob, name));
  if (managed.mode !== "selected-entries") throw new Error("Unexpected mode");
  expect(managed.outputs[0]?.downloadName).toBe("output-1.bin");
});

test("rejects suggested names outside opaque selected entries", () => {
  const { manager, createObjectURL } = managerHarness();
  const blob = new Blob(["pdf"], { type: "application/pdf" });
  const result: LocalWorkerResult = {
    mode: "files",
    outputs: [{ blob, suggestedDownloadName: "private.pdf" }],
    metadata: { resultMode: "files", outputMimeTypes: [blob.type], outputBytes: [blob.size] },
  };
  expect(() => manager.create(capability("pdf.merge"), result)).toThrow(/suggested download name/i);
  expect(createObjectURL).not.toHaveBeenCalled();
});

test.each([
  ["file capability returning a value", capability("pdf.merge"), valueResult({ kind: "text", text: "private" })],
  ["value capability returning files", capability("utility.unit"), fileResult(new Blob(["x"], { type: "application/pdf" }))],
  ["metadata mode mismatch", capability("pdf.merge"), fileResult(new Blob(["x"], { type: "application/pdf" }), { resultMode: "selected-entries" })],
  ["undeclared MIME", capability("pdf.merge"), fileResult(new Blob(["x"], { type: "image/png" }))],
  ["metadata size mismatch", capability("pdf.merge"), fileResult(new Blob(["x"], { type: "application/pdf" }), { outputBytes: [999] })],
])("rejects %s before retaining results", (_label, manifest, result) => {
  const { manager, createObjectURL } = managerHarness();
  expect(() => manager.create(manifest, result)).toThrow();
  expect(createObjectURL).not.toHaveBeenCalled();
});

test.each([
  ["utility.unit", { kind: "number", display: "1 meter", numericValue: 1, unit: "m" } satisfies LocalValuePayload],
  ["utility.time", { kind: "time", display: "12:00", iso: "2026-08-28T12:00:00Z", zone: "UTC", utcOffset: "+00:00" } satisfies LocalValuePayload],
  ["utility.password", { kind: "password", value: "local-only" } satisfies LocalValuePayload],
  ["image.color-picker", { kind: "color", hex: "#ffffff", rgb: "255 255 255", hsl: "0 0% 100%" } satisfies LocalValuePayload],
  ["image.color-extractor", { kind: "palette", colors: [{ hex: "#ffffff", proportion: 1 }] } satisfies LocalValuePayload],
])("stores and disposes the %s local value without object URLs", (id, value) => {
  const { manager, createObjectURL, revokeObjectURL } = managerHarness();
  const managed = manager.create(capability(id), valueResult(value));
  expect(managed).toEqual({ id: "result-1", mode: "value", value, metadata: { resultMode: "value", outputMimeTypes: [], outputBytes: [] } });
  expect(createObjectURL).not.toHaveBeenCalled();
  manager.dispose(managed.id);
  expect(revokeObjectURL).not.toHaveBeenCalled();
  expect((manager as unknown as { entries: Map<string, unknown> }).entries.size).toBe(0);
});
