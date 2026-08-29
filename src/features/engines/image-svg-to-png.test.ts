import { describe, test, expect } from "vitest";
import { createImageSvgToPngAdapter } from "./image-svg-to-png";

describe("SVG to PNG Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageSvgToPngAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("svg");
  });
  test("validate returns empty", async () => {
    const adapter = createImageSvgToPngAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
