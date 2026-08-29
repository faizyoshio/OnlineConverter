import { describe, test, expect } from "vitest";
import { createImageJfifToPngAdapter } from "./image-jfif-to-png";

describe("JFIF to PNG Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageJfifToPngAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("jfif");
  });
  test("validate returns empty", async () => {
    const adapter = createImageJfifToPngAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
