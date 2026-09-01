import { describe, test, expect } from "vitest";
import { createArchiveZipCreateAdapter } from "./archive-zip-create";

describe("ZIP Creator Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createArchiveZipCreateAdapter();
    const probe = await adapter.probe(new File(["abc"], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("binary");
    expect(probe.bytes).toBe(3);
  });
  test("validate returns empty", async () => {
    const adapter = createArchiveZipCreateAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
