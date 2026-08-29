import { describe, test, expect } from "vitest";
import { createUtilityPasswordAdapter } from "./utility-password";

describe("Password Generator Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createUtilityPasswordAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("binary");
  });
  test("validate returns empty", async () => {
    const adapter = createUtilityPasswordAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
