import { describe, test, expect } from "vitest";
import { createImageRotateAdapter } from "./image-rotate";

describe("Image Rotate Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageRotateAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("png");
  });
  test("validate returns empty", async () => {
    const adapter = createImageRotateAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
