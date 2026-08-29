import { describe, test, expect } from "vitest";
import { createImageHeicToJpgAdapter } from "./image-heic-to-jpg";

describe("HEIC to JPG Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageHeicToJpgAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("heic");
  });
  test("validate returns empty", async () => {
    const adapter = createImageHeicToJpgAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
