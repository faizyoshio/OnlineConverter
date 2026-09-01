import { describe, test, expect } from "vitest";
import { createValidPdfFile } from "@/test/fixtures/pdf";
import { createPdfResizeAdapter } from "./pdf-resize";

describe("PDF Resize Adapter", () => {
  test("probes actual PDF metadata", async () => {
    const adapter = createPdfResizeAdapter();
    const probe = await adapter.probe(await createValidPdfFile(2));
    expect(probe).toEqual(expect.objectContaining({ kind: "pdf", pages: 2 }));
  });
  test("rejects unsupported resize combinations", async () => {
    const adapter = createPdfResizeAdapter();
    await expect(adapter.validate([], { pageSize: "a4", fit: "fit", alignment: "center" })).resolves.toEqual([]);
    await expect(adapter.validate([], { pageSize: "letter", fit: "fit", alignment: "center" })).resolves.toEqual([
      expect.objectContaining({ code: "malformed-input", field: "options" }),
    ]);
  });
});
