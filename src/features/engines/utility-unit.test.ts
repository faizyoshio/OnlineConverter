import { describe, test, expect } from "vitest";
import { createUnitConverterAdapter } from "./utility-unit";

describe("Unit Converter Adapter", () => {
  test("probe reports an unexpected value-file call without inventing metadata", async () => {
    const adapter = createUnitConverterAdapter();
    const probe = await adapter.probe(new File([], "values.txt", { type: "text/plain" }));
    expect(probe.kind).toBe("unknown");
  });

  test("validate accepts complete unit values", async () => {
    const adapter = createUnitConverterAdapter();
    const issues = await adapter.validate([], { value: 1, category: "length", fromUnit: "m", toUnit: "km", maxSignificantDigits: 8 });
    expect(issues).toEqual([]);
  });
});
