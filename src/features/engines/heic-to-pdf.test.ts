import { describe, expect, test } from "vitest";
import { createHeicBrandFile } from "@/test/fixtures/pdf-inputs";
import { createHeicToPdfAdapter } from "./heic-to-pdf";

describe("HEIC to PDF adapter", () => {
  test("probes a HEIC-branded file as HEIC", async () => {
    const adapter = createHeicToPdfAdapter();
    const probe = await adapter.probe(createHeicBrandFile());

    expect(probe).toEqual(expect.objectContaining({ kind: "heic", probeRule: "heic-brand" }));
  });

  test("accepts a HEIC file with the manifest defaults", async () => {
    const adapter = createHeicToPdfAdapter();
    const issues = await adapter.validate([createHeicBrandFile()], {
      pageSize: "a4",
      fit: "contain",
      marginMm: 12,
      jpegQuality: 90,
    });

    expect(issues).toEqual([]);
  });
});
