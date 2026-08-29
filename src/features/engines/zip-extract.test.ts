import { describe, test, expect } from "vitest";
import { createZipExtractAdapter } from "./zip-extract";

describe("ZIP Extract Adapter", () => {
  test("probe returns zip kind", async () => {
    const adapter = createZipExtractAdapter();
    const probe = await adapter.probe(new File([], "test.zip", { type: "application/zip" }));
    expect(probe.kind).toBe("zip");
    expect(probe.probeRule).toBe("zip-header");
  });

  test("validate returns empty for valid inputs", async () => {
    const adapter = createZipExtractAdapter();
    const issues = await adapter.validate([new File([], "a.zip", { type: "application/zip" })], {});
    expect(issues).toEqual([]);
  });
});
