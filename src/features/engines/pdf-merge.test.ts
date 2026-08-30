import { describe, expect, test } from "vitest";
import { createPdfMergeAdapter } from "./pdf-merge";
import { createValidPdfFile, createTruncatedPdfFile } from "@/test/fixtures/pdf";

describe("PDF Merge Adapter", () => {
  test("probe returns pdf kind and pdf-header rule for valid PDFs", async () => {
    const adapter = createPdfMergeAdapter();
    const probe = await adapter.probe(await createValidPdfFile(1));
    expect(probe.kind).toBe("pdf");
    expect(probe.probeRule).toBe("pdf-header");
  });

  test("probe treats a truncated PDF as unknown", async () => {
    const adapter = createPdfMergeAdapter();

    await expect(adapter.probe(createTruncatedPdfFile())).resolves.toEqual({
      kind: "unknown",
      probeRule: "unknown",
      bytes: 0,
    });
  });

  test("validate returns empty array for valid inputs", async () => {
    const adapter = createPdfMergeAdapter();
    const issues = await adapter.validate(
      [await createValidPdfFile(1), await createValidPdfFile(2)],
      {},
    );
    expect(issues).toEqual([]);
  });
});
