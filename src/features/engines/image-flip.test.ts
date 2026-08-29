import { describe, test, expect } from "vitest";
import { createImageFlipAdapter } from "./image-flip";

describe("Image Flip Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageFlipAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("png");
  });
  test("validate returns empty", async () => {
    const adapter = createImageFlipAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
