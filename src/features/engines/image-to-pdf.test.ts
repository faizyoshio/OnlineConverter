import { describe, expect, test } from "vitest";
import { createValidPngFile } from "@/test/fixtures/pdf-inputs";
import { createImageToPdfAdapter } from "./image-to-pdf";

describe("Image to PDF adapter", () => {
  test("probes a valid PNG as PNG", async () => {
    const adapter = createImageToPdfAdapter();
    const probe = await adapter.probe(createValidPngFile());

    expect(probe).toEqual(expect.objectContaining({ kind: "png", probeRule: "png-signature" }));
  });

  test("accepts valid files with the manifest defaults", async () => {
    const adapter = createImageToPdfAdapter();
    const issues = await adapter.validate([createValidPngFile()], {
      pageSize: "a4",
      fit: "contain",
      marginMm: 12,
      order: "input-order",
    });

    expect(issues).toEqual([]);
  });
});
