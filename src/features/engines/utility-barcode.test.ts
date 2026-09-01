import { describe, test, expect } from "vitest";
import { createUtilityBarcodeAdapter } from "./utility-barcode";

describe("Barcode Generator Adapter", () => {
  test("probe returns unknown for an unexpected file", async () => {
    const adapter = createUtilityBarcodeAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("unknown");
  });
  test("validate returns empty", async () => {
    const adapter = createUtilityBarcodeAdapter();
    const issues = await adapter.validate([], { text: "ABC-123", format: "code-128", target: "svg", quietZonePx: 10 });
    expect(issues).toEqual([]);
  });
});
