import { describe, test, expect } from "vitest";
import { createImageCompressJpgAdapter } from "./image-compress-jpg";

describe("Compress JPG Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageCompressJpgAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("jpeg");
  });
  test("validate returns empty", async () => {
    const adapter = createImageCompressJpgAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
