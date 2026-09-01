import { describe, expect, test } from "vitest";
import type { LocalWorkerOperationContext } from "@/features/workers/local-runtime";
import { processUtilityOperation } from "./worker-operation";

function context(overrides: Partial<LocalWorkerOperationContext> = {}): LocalWorkerOperationContext {
  return {
    capabilityId: "utility.unit",
    jobId: "utility-job",
    inputs: [],
    options: {},
    isCancelled: () => false,
    reportProgress: () => undefined,
    ...overrides,
  };
}

describe("utility worker operation", () => {
  test("returns exact number and time value payloads", async () => {
    const unit = await processUtilityOperation(context({ options: { value: 1, category: "length", fromUnit: "km", toUnit: "m", maxSignificantDigits: 8 } }));
    expect(unit).toEqual({ mode: "value", value: { kind: "number", numericValue: 1000, display: "1000 m", unit: "m" }, metadata: { resultMode: "value", outputMimeTypes: [], outputBytes: [] } });

    const time = await processUtilityOperation(context({ capabilityId: "utility.time", options: { dateTime: "2026-01-15T12:00:00", fromZone: "Asia/Jakarta", toZone: "UTC" } }));
    expect(time.mode).toBe("value");
    if (time.mode !== "value" || time.value.kind !== "time") throw new Error("Expected time value");
    expect(time.value).toMatchObject({ kind: "time", iso: "2026-01-15T05:00:00.000Z", zone: "UTC", utcOffset: "GMT" });
    expect(time.metadata).toEqual({ resultMode: "value", outputMimeTypes: [], outputBytes: [] });
  });

  test("returns a password value and never puts it in metadata", async () => {
    const result = await processUtilityOperation(context({ capabilityId: "utility.password", options: { length: 8 } }), {
      generatePassword: () => "Aa2!Aa2!",
      generateBarcodeSvg: async () => "<svg viewBox=\"0 0 1 1\"></svg>",
      generateBarcodePng: async () => new Blob(["png"], { type: "image/png" }),
    });
    expect(result).toEqual({ mode: "value", value: { kind: "password", value: "Aa2!Aa2!" }, metadata: { resultMode: "value", outputMimeTypes: [], outputBytes: [] } });
    expect(JSON.stringify(result.metadata)).not.toContain("Aa2");
  });

  test("generates SVG and PNG barcode file results", async () => {
    const svg = await processUtilityOperation(context({ capabilityId: "utility.barcode", options: { text: "ABC-123", format: "code-128", target: "svg", quietZonePx: 10 } }));
    expect(svg.mode).toBe("files");
    if (svg.mode !== "files") throw new Error("Expected file result");
    expect(svg.outputs[0]!.blob.type).toBe("image/svg+xml");
    await expect(svg.outputs[0]!.blob.text()).resolves.toMatch(/^<svg\b/);

    let renderedText = "";
    const png = await processUtilityOperation(context({ capabilityId: "utility.barcode", options: { text: "ABC-123", format: "code-128", target: "png", quietZonePx: 10 } }), {
      generatePassword: () => "unused",
      generateBarcodeSvg: async () => "<svg viewBox=\"0 0 2 3\"></svg>",
      generateBarcodePng: async (options) => { renderedText = options.text; return new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }); },
    });
    expect(renderedText).toBe("ABC-123");
    expect(png.mode).toBe("files");
    if (png.mode === "files") expect(png.metadata).toEqual({ resultMode: "files", outputMimeTypes: ["image/png"], outputBytes: [3] });
  });

  test("reports truthful stages, rejects invalid options, and stops on cancellation", async () => {
    const stages: string[] = [];
    await processUtilityOperation(context({
      options: { value: 1, category: "length", fromUnit: "m", toUnit: "cm", maxSignificantDigits: 8 },
      reportProgress: (_value, stage) => stages.push(stage),
    }));
    expect(stages).toEqual(["Validating values", "Converting units", "Finalizing result"]);
    await expect(processUtilityOperation(context({ options: { value: "not-a-number", category: "length", fromUnit: "m", toUnit: "cm" } }))).rejects.toThrow("numeric value");
    await expect(processUtilityOperation(context({ isCancelled: () => true }))).rejects.toThrow("cancelled");
  });
});
