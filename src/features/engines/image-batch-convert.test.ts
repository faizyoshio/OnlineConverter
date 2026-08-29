import { describe, test, expect } from "vitest";
import { createImageBatchConvertAdapter } from "./image-batch-convert";

describe("Batch Convert Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageBatchConvertAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("png");
  });
  test("validate returns empty", async () => {
    const adapter = createImageBatchConvertAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
