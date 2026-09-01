import { describe, test, expect } from "vitest";
import { createValidPdfFile } from "@/test/fixtures/pdf";
import { createPdfCropAdapter } from "./pdf-crop";

describe("PDF Crop Adapter", () => {
  test("probes actual PDF metadata", async () => {
    const adapter = createPdfCropAdapter();
    const probe = await adapter.probe(await createValidPdfFile(2));
    expect(probe).toEqual(expect.objectContaining({ kind: "pdf", pages: 2 }));
  });
  test("validates the four bounded crop margins", async () => {
    const adapter = createPdfCropAdapter();
    await expect(adapter.validate([], { cropBox: "10,10,10,10", pages: "1", applyToAll: false })).resolves.toEqual([]);
    await expect(adapter.validate([], { cropBox: "10,not-a-number,10,10", pages: "1", applyToAll: false })).resolves.toEqual([
      expect.objectContaining({ code: "malformed-input", field: "options.cropBox" }),
    ]);
  });
});
