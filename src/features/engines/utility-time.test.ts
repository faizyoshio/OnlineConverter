import { describe, test, expect } from "vitest";
import { createUtilityTimeAdapter } from "./utility-time";

describe("Time Converter Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createUtilityTimeAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("binary");
  });
  test("validate returns empty", async () => {
    const adapter = createUtilityTimeAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
