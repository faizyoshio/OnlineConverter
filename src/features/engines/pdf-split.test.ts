import { describe, expect, test } from "vitest";
import { createPdfSplitAdapter } from "./pdf-split";
import { createValidPdfFile } from "@/test/fixtures/pdf";

describe("PDF Split Adapter", () => {
  test("probe returns pdf kind for valid PDFs", async () => {
    const adapter = createPdfSplitAdapter();
    const probe = await adapter.probe(await createValidPdfFile(1));
    expect(probe.kind).toBe("pdf");
  });

  test("validates accepted page ranges", async () => {
    const adapter = createPdfSplitAdapter();
    const issues = await adapter.validate([await createValidPdfFile(1)], { ranges: "1" });
    expect(issues).toEqual([]);
  });

  test("rejects malformed page ranges", async () => {
    const adapter = createPdfSplitAdapter();
    await expect(adapter.validate([await createValidPdfFile(1)], { ranges: "one-two" })).resolves.toEqual([
      expect.objectContaining({ code: "malformed-input", field: "ranges" }),
    ]);
  });
});
