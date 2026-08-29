import { describe, test, expect } from "vitest";
import { createImageJpgToPngAdapter } from "./image-jpg-to-png";

describe("JPG to PNG Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageJpgToPngAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("jpeg");
  });
  test("validate returns empty", async () => {
    const adapter = createImageJpgToPngAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
