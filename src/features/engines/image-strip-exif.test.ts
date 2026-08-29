import { describe, test, expect } from "vitest";
import { createImageStripExifAdapter } from "./image-strip-exif";

describe("Strip EXIF Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageStripExifAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("jpeg");
  });
  test("validate returns empty", async () => {
    const adapter = createImageStripExifAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
