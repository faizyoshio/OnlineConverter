import { describe, test, expect } from "vitest";
import { createPdfCompressAdapter } from "./pdf-compress";
import { createValidPdfFile } from "@/test/fixtures/pdf";

describe("PDF Compress Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfCompressAdapter();
    const probe = await adapter.probe(await createValidPdfFile(1));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfCompressAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
