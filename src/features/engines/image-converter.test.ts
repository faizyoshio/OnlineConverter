import { describe, test, expect } from "vitest";
import { createImageConverterAdapter } from "./image-converter";

describe("Image Converter Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageConverterAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("png");
  });
  test("validate returns empty", async () => {
    const adapter = createImageConverterAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
