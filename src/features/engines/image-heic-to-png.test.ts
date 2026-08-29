import { describe, test, expect } from "vitest";
import { createImageHeicToPngAdapter } from "./image-heic-to-png";

describe("HEIC to PNG Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageHeicToPngAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("heic");
  });
  test("validate returns empty", async () => {
    const adapter = createImageHeicToPngAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
