import { describe, test, expect } from "vitest";
import { createTrustSignPdfAdapter } from "./trust-sign-pdf";

describe("Sign PDF Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createTrustSignPdfAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("pdf");
  });
  test("validate returns empty", async () => {
    const adapter = createTrustSignPdfAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
