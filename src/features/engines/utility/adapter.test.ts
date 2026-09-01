import { afterEach, describe, expect, test, vi } from "vitest";
import { BrowserWorkerBridge } from "@/features/workers/browser-worker";
import { createUtilityAdapter, type UtilityCapabilityId } from "./adapter";

class NativeWorkerDouble {
  static latest: NativeWorkerDouble | undefined;
  constructor(readonly url: URL, readonly options: WorkerOptions) { NativeWorkerDouble.latest = this; }
  postMessage(): void {}
  addEventListener(): void {}
  removeEventListener(): void {}
  terminate(): void {}
}

afterEach(() => vi.unstubAllGlobals());

const validOptions: Readonly<Record<UtilityCapabilityId, Readonly<Record<string, unknown>>>> = {
  "utility.unit": { value: 1, category: "length", fromUnit: "km", toUnit: "m", maxSignificantDigits: 8 },
  "utility.time": { dateTime: "2026-01-15T12:00:00", fromZone: "Asia/Jakarta", toZone: "UTC" },
  "utility.barcode": { text: "ABC-123", format: "code-128", target: "svg", quietZonePx: 10 },
  "utility.password": { length: 20, uppercase: true, lowercase: true, digits: true, symbols: true, excludeAmbiguous: true },
};

describe("utility adapter", () => {
  test.each(Object.entries(validOptions) as [UtilityCapabilityId, Readonly<Record<string, unknown>>][])("validates %s options locally", async (capabilityId, options) => {
    await expect(createUtilityAdapter(capabilityId).validate([], options)).resolves.toEqual([]);
  });

  test("returns normalized issues for invalid values", async () => {
    await expect(createUtilityAdapter("utility.unit").validate([], { value: "x", category: "length", fromUnit: "m", toUnit: "km" })).resolves.toEqual([
      { code: "malformed-input", field: "options", message: "One or more local utility values are invalid." },
    ]);
  });

  test.each(Object.keys(validOptions) as UtilityCapabilityId[])("%s uses a module browser worker", (capabilityId) => {
    vi.stubGlobal("Worker", NativeWorkerDouble);
    const worker = createUtilityAdapter(capabilityId).createWorker();
    expect(worker).toBeInstanceOf(BrowserWorkerBridge);
    expect(NativeWorkerDouble.latest?.options).toEqual({ type: "module" });
  });
});
