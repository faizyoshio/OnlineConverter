import { describe, test, expect } from "vitest";
import { createImageToPdfAdapter } from "./image-to-pdf";

describe("Image to PDF Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageToPdfAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("jpeg");
  });
  test("validate returns empty", async () => {
    const adapter = createImageToPdfAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
