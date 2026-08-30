import { describe, expect, test } from "vitest";
import { PDFDocument } from "pdf-lib";
import { extractZip } from "@/engines/utility/operations";
import { createTruncatedPdfFile, createValidPdfFile } from "@/test/fixtures/pdf";
import { probePdf } from "./probe";
import { processPdfOperation } from "./worker-operation";

async function pageCount(bytes: Uint8Array): Promise<number> {
  return (await PDFDocument.load(Uint8Array.from(bytes))).getPageCount();
}

describe("PDF worker operations", () => {
  test("probes valid PDF metadata without producing output", async () => {
    const probe = await probePdf(await createValidPdfFile(3));

    expect(probe).toEqual(expect.objectContaining({ kind: "pdf", probeRule: "pdf-header", pages: 3 }));
  });

  test("treats a truncated PDF as unknown", async () => {
    await expect(probePdf(createTruncatedPdfFile())).resolves.toEqual({
      kind: "unknown",
      probeRule: "unknown",
      bytes: 0,
    });
  });

  test("merges PDFs through worker operation context", async () => {
    const progress: string[] = [];
    const result = await processPdfOperation({
      capabilityId: "pdf.merge",
      jobId: "job-merge",
      inputs: [await createValidPdfFile(1, "one.pdf"), await createValidPdfFile(2, "two.pdf")],
      options: {},
      isCancelled: () => false,
      reportProgress: (_value: number | null, stageLabel: string) => progress.push(stageLabel),
    });

    expect(result.mode).toBe("files");
    if (result.mode !== "files") throw new Error("Expected file result");
    expect(result.outputs).toHaveLength(1);
    expect(result.outputs[0]?.suggestedDownloadName).toBeUndefined();
    expect(await pageCount(new Uint8Array(await result.outputs[0]!.blob.arrayBuffer()))).toBe(3);
    expect(result.metadata).toEqual(expect.objectContaining({ resultMode: "files", pages: 3 }));
    expect(progress).toContain("Merging PDFs");
  });

  test("splits multiple ranges into a ZIP of local PDFs", async () => {
    const result = await processPdfOperation({
      capabilityId: "pdf.split",
      jobId: "job-split",
      inputs: [await createValidPdfFile(3)],
      options: { ranges: "1,2-3", onePerRange: true },
      isCancelled: () => false,
      reportProgress: () => undefined,
    });

    expect(result.mode).toBe("files");
    if (result.mode !== "files") throw new Error("Expected file result");
    expect(result.outputs).toHaveLength(1);
    expect(result.outputs[0]?.blob.type).toBe("application/zip");
    const entries = await extractZip(new Uint8Array(await result.outputs[0]!.blob.arrayBuffer()));
    expect(entries.map((entry) => entry.name)).toEqual(["split-1.pdf", "split-2.pdf"]);
    expect(await pageCount(entries[0]!.bytes)).toBe(1);
    expect(await pageCount(entries[1]!.bytes)).toBe(2);
  });
});