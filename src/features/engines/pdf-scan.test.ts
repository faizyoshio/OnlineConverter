import { describe, test, expect } from "vitest";
import { createPdfScanAdapter } from "./pdf-scan";
import { VALID_PNG_BYTES } from "@/test/fixtures/pdf-inputs";

describe("PDF Scan Adapter", () => {
  test("probe returns expected kind for image", async () => {
    const adapter = createPdfScanAdapter();
    const probe = await adapter.probe(new File([VALID_PNG_BYTES], "scan.png", { type: "image/png" }));
    expect(probe.kind).toBe("png");
  });
  test("validate returns empty with valid inputs", async () => {
    const adapter = createPdfScanAdapter();
    const issues = await adapter.validate([new File([VALID_PNG_BYTES], "scan.png", { type: "image/png" })], {});
    expect(issues).toEqual([]);
  });
});
