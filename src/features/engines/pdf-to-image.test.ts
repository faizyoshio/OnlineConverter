import { describe, test, expect } from "vitest";
import { createPdfToImageAdapter } from "./pdf-to-image";
import { createValidPdfFile } from "@/test/fixtures/pdf";

describe("PDF to Image Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createPdfToImageAdapter();
    const probe = await adapter.probe(await createValidPdfFile(1));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createPdfToImageAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
