import { describe, test, expect } from "vitest";
import { createImageBatchCompressAdapter } from "./image-batch-compress";

describe("Batch Compress Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createImageBatchCompressAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("png");
  });
  test("validate returns empty", async () => {
    const adapter = createImageBatchCompressAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
