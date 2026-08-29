import { describe, test, expect } from "vitest";
import { createUtilityBarcodeAdapter } from "./utility-barcode";

describe("Barcode Generator Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createUtilityBarcodeAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("binary");
  });
  test("validate returns empty", async () => {
    const adapter = createUtilityBarcodeAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
