import { describe, test, expect } from "vitest";
import { createImageBatchCropAdapter } from "./image-batch-crop";

describe("Batch Crop Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageBatchCropAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("png");
  });
  test("validate returns empty", async () => {
    const adapter = createImageBatchCropAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
