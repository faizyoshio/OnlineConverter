import { describe, test, expect } from "vitest";
import { createImageBmpToJpgAdapter } from "./image-bmp-to-jpg";

describe("BMP to JPG Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageBmpToJpgAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("bmp");
  });
  test("validate returns empty", async () => {
    const adapter = createImageBmpToJpgAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
