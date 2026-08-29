import { describe, test, expect } from "vitest";
import { createImageBmpToPngAdapter } from "./image-bmp-to-png";

describe("BMP to PNG Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageBmpToPngAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("bmp");
  });
  test("validate returns empty", async () => {
    const adapter = createImageBmpToPngAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
