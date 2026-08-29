import { describe, test, expect } from "vitest";
import { createImageColorExtractorAdapter } from "./image-color-extractor";

describe("Color Extractor Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageColorExtractorAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("png");
  });
  test("validate returns empty", async () => {
    const adapter = createImageColorExtractorAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
