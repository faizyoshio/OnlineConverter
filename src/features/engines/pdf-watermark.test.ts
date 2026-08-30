import { describe, expect, test } from "vitest";
import { createValidPdfFile } from "@/test/fixtures/pdf";
import { createPdfWatermarkAdapter } from "./pdf-watermark";

describe("PDF Watermark adapter", () => {
  test("probes a valid PDF", async () => {
    const adapter = createPdfWatermarkAdapter();
    const probe = await adapter.probe(await createValidPdfFile());

    expect(probe).toEqual(expect.objectContaining({ kind: "pdf", probeRule: "pdf-header" }));
  });

  test("accepts a text watermark with the manifest defaults", async () => {
    const adapter = createPdfWatermarkAdapter();
    const issues = await adapter.validate([await createValidPdfFile()], {
      watermarkType: "text",
      watermarkText: "WATERMARK",
      position: "center",
      opacity: 30,
      pages: "all",
    });

    expect(issues).toEqual([]);
  });
});
