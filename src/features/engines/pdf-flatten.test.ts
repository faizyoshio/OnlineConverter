import { describe, test, expect } from "vitest";
import { createValidPdfFile } from "@/test/fixtures/pdf";
import { createPdfFlattenAdapter } from "./pdf-flatten";

describe("PDF Flatten Adapter", () => {
  test("probes actual PDF metadata", async () => {
    const adapter = createPdfFlattenAdapter();
    const probe = await adapter.probe(await createValidPdfFile(3));
    expect(probe).toEqual(expect.objectContaining({ kind: "pdf", pages: 3 }));
  });

  test("validate returns empty array for valid options", async () => {
    const adapter = createPdfFlattenAdapter();
    const issues = await adapter.validate([], { formAppearances: true, annotations: true });
    expect(issues).toEqual([]);
  });
});
