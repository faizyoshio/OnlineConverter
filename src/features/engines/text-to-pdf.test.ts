import { describe, expect, test } from "vitest";
import { createUtf8TextFile } from "@/test/fixtures/pdf-inputs";
import { createTextToPdfAdapter } from "./text-to-pdf";

describe("Text to PDF adapter", () => {
  test("probes a UTF-8 text file as text", async () => {
    const adapter = createTextToPdfAdapter();
    const probe = await adapter.probe(createUtf8TextFile());

    expect(probe).toEqual(expect.objectContaining({ kind: "text", probeRule: "utf8-text" }));
  });

  test("accepts the manifest defaults", async () => {
    const adapter = createTextToPdfAdapter();
    const issues = await adapter.validate([createUtf8TextFile()], {
      pageSize: "a4",
      orientation: "portrait",
      fontSizePt: 12,
      wrap: true,
    });

    expect(issues).toEqual([]);
  });
});
