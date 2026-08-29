import { describe, test, expect } from "vitest";
import { createImageBatchWatermarkAdapter } from "./image-batch-watermark";

describe("Batch Watermark Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageBatchWatermarkAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("png");
  });
  test("validate returns empty", async () => {
    const adapter = createImageBatchWatermarkAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
