import { describe, test, expect } from "vitest";
import { createImageBatchResizeAdapter } from "./image-batch-resize";

describe("Batch Resize Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageBatchResizeAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("png");
  });
  test("validate returns empty", async () => {
    const adapter = createImageBatchResizeAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
