import { describe, test, expect } from "vitest";
import { createTrustBlurFacesAdapter } from "./trust-blur-faces";

describe("Blur Faces Adapter", () => {
  test("probe returns expected kind", async () => {
    const adapter = createTrustBlurFacesAdapter();
    const probe = await adapter.probe(new File([], "test", { type: "application/octet-stream" }));
    expect(probe.kind).toBe("jpeg");
  });
  test("validate returns empty", async () => {
    const adapter = createTrustBlurFacesAdapter();
    const issues = await adapter.validate([], {});
    expect(issues).toEqual([]);
  });
});
