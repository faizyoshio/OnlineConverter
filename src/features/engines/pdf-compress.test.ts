import { describe, test, expect } from "vitest";
import { createPdfCompressAdapter } from "./pdf-compress";

describe("PDF Compress Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfCompressAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfCompressAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
