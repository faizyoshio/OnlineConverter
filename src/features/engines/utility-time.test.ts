import { describe, test, expect } from "vitest";
import { createUtilityTimeAdapter } from "./utility-time";

describe("Time Converter Adapter", () => {
  test("probe returns unknown for an unexpected file", async () => {
    const adapter = createUtilityTimeAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("unknown");
  });
  test("validate returns empty", async () => {
    const adapter = createUtilityTimeAdapter();
    const issues = await adapter.validate([], { dateTime: "2026-01-15T12:00:00", fromZone: "Asia/Jakarta", toZone: "UTC" });
    expect(issues).toEqual([]);
  });
});
