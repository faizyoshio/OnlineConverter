import { describe, test, expect } from "vitest";
import { createUnitConverterAdapter } from "./utility-unit";

describe("Unit Converter Adapter", () => {
  test("probe returns binary kind", async () => {
    const adapter = createUnitConverterAdapter();
    const probe = await adapter.probe(new File([], "values.txt", { type: "text/plain" }));
    expect(probe.kind).toBe("binary");
  });

  test("validate returns empty", async () => {
    const adapter = createUnitConverterAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
