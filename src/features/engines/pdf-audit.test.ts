import { describe, expect, test } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createPdfMergeAdapter } from "./pdf-merge";
import { createPdfSplitAdapter } from "./pdf-split";
import { createPdfOrganizeAdapter } from "./pdf-organize";
import { processPdfOperation } from "./pdf/worker-operation";
import { mergePdfs, splitPdf, organizePdf } from "@/engines/pdf/operations";
import { createValidPdfFile, createTruncatedPdfFile, TRUNCATED_PDF_BYTES } from "@/test/fixtures/pdf";
import { capabilityValidator } from "@/features/validation/capability-validator";
import { pdfCapabilities } from "@/features/capabilities/registry/pdf";

import type { CapabilityManifest } from "@/features/capabilities/schema";
import type { ProbeAndValidateAdapter } from "@/features/validation/types";

const mergeManifest = pdfCapabilities.find((c) => c.id === "pdf.merge")!;
const splitManifest = pdfCapabilities.find((c) => c.id === "pdf.split")!;
const organizeManifest = pdfCapabilities.find((c) => c.id === "pdf.organize")!;
const validateCapabilityExecution = (
  manifest: CapabilityManifest,
  adapter: ProbeAndValidateAdapter<Readonly<Record<string, unknown>>>,
  files: readonly File[],
  options: Readonly<Record<string, unknown>>,
) => capabilityValidator.validateWithAdapter(manifest, files, options, adapter);

describe("PDF Core Audit: Capability Manifests & Limits", () => {
  test("pdf.merge manifest defines proper limits (min 2, max 20)", () => {
    expect(mergeManifest.limits.minimumFiles).toBe(2);
    expect(mergeManifest.limits.maximumFiles).toBe(20);
    expect(mergeManifest.inputMode).toBe("files");
  });

  test("pdf.split manifest defines proper limits (min 1, max 1)", () => {
    expect(splitManifest.limits.minimumFiles).toBe(1);
    expect(splitManifest.limits.maximumFiles).toBe(1);
  });

  test("pdf.organize manifest defines proper limits (min 1, max 1)", () => {
    expect(organizeManifest.limits.minimumFiles).toBe(1);
    expect(organizeManifest.limits.maximumFiles).toBe(1);
  });

  test("manifest validation rejects empty inputs (< minimumFiles)", async () => {
    const mergeAdapter = createPdfMergeAdapter();
    const issues = await validateCapabilityExecution(mergeManifest, mergeAdapter, [], {});
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "malformed-input",
          field: "files",
          measured: 0,
          limit: 2,
        }),
      ]),
    );

    const splitAdapter = createPdfSplitAdapter();
    const splitIssues = await validateCapabilityExecution(splitManifest, splitAdapter, [], {});
    expect(splitIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "malformed-input",
          field: "files",
          measured: 0,
          limit: 1,
        }),
      ]),
    );

    const organizeAdapter = createPdfOrganizeAdapter();
    const orgIssues = await validateCapabilityExecution(organizeManifest, organizeAdapter, [], {});
    expect(orgIssues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "malformed-input",
          field: "files",
          measured: 0,
          limit: 1,
        }),
      ]),
    );
  });

  test("manifest validation rejects single input for pdf.merge", async () => {
    const mergeAdapter = createPdfMergeAdapter();
    const file = await createValidPdfFile(1, "one.pdf");
    const issues = await validateCapabilityExecution(mergeManifest, mergeAdapter, [file], {});
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "malformed-input",
          field: "files",
          measured: 1,
          limit: 2,
        }),
      ]),
    );
  });
});

describe("PDF Core Audit: Corrupt and Truncated Bytes", () => {
  test("probe treats 0-byte file as unknown", async () => {
    const emptyFile = new File([], "empty.pdf", { type: "application/pdf" });
    const mergeAdapter = createPdfMergeAdapter();
    const splitAdapter = createPdfSplitAdapter();
    const orgAdapter = createPdfOrganizeAdapter();

    await expect(mergeAdapter.probe(emptyFile)).resolves.toEqual({ kind: "unknown", probeRule: "unknown", bytes: 0 });
    await expect(splitAdapter.probe(emptyFile)).resolves.toEqual({ kind: "unknown", probeRule: "unknown", bytes: 0 });
    await expect(orgAdapter.probe(emptyFile)).resolves.toEqual({ kind: "unknown", probeRule: "unknown", bytes: 0 });
  });

  test("probe treats truncated bytes as unknown", async () => {
    const truncatedFile = createTruncatedPdfFile();
    const mergeAdapter = createPdfMergeAdapter();
    const splitAdapter = createPdfSplitAdapter();
    const orgAdapter = createPdfOrganizeAdapter();

    await expect(mergeAdapter.probe(truncatedFile)).resolves.toEqual({ kind: "unknown", probeRule: "unknown", bytes: 0 });
    await expect(splitAdapter.probe(truncatedFile)).resolves.toEqual({ kind: "unknown", probeRule: "unknown", bytes: 0 });
    await expect(orgAdapter.probe(truncatedFile)).resolves.toEqual({ kind: "unknown", probeRule: "unknown", bytes: 0 });
  });

  test("probe treats garbage bytes with %PDF- header as unknown when loading fails", async () => {
    const garbageFile = new File([new TextEncoder().encode("%PDF-9.9\\ngarbage content not a valid pdf")], "garbage.pdf", { type: "application/pdf" });
    const mergeAdapter = createPdfMergeAdapter();
    await expect(mergeAdapter.probe(garbageFile)).resolves.toEqual({ kind: "unknown", probeRule: "unknown", bytes: 0 });
  });

  test("operations reject corrupt/truncated bytes with errors", async () => {
    await expect(mergePdfs([TRUNCATED_PDF_BYTES])).rejects.toThrow();
    await expect(splitPdf(TRUNCATED_PDF_BYTES, [[0, 0]])).rejects.toThrow();
    await expect(organizePdf(TRUNCATED_PDF_BYTES, [0])).rejects.toThrow();
  });

  test("worker-operation rejects corrupt/truncated bytes with errors", async () => {
    const corruptFile = createTruncatedPdfFile();
    await expect(
      processPdfOperation({
        capabilityId: "pdf.merge",
        jobId: "j-merge-corrupt",
        inputs: [corruptFile, corruptFile],
        options: {},
        isCancelled: () => false,
        reportProgress: () => undefined,
      }),
    ).rejects.toThrow();

    await expect(
      processPdfOperation({
        capabilityId: "pdf.split",
        jobId: "j-split-corrupt",
        inputs: [corruptFile],
        options: { ranges: "1" },
        isCancelled: () => false,
        reportProgress: () => undefined,
      }),
    ).rejects.toThrow();

    await expect(
      processPdfOperation({
        capabilityId: "pdf.organize",
        jobId: "j-org-corrupt",
        inputs: [corruptFile],
        options: { operations: "1" },
        isCancelled: () => false,
        reportProgress: () => undefined,
      }),
    ).rejects.toThrow();
  });
});

describe("PDF Core Audit: Split Edge Cases and Page Ranges", () => {
  test("adapter validation checks for malformed range strings", async () => {
    const adapter = createPdfSplitAdapter();
    const file = await createValidPdfFile(2);

    const issueLetters = await adapter.validate([file], { ranges: "page 1" });
    expect(issueLetters).toHaveLength(1);
    expect(issueLetters[0]?.code).toBe("malformed-input");

    const issueNegative = await adapter.validate([file], { ranges: "-1-2" });
    expect(issueNegative).toHaveLength(1);
    expect(issueNegative[0]?.code).toBe("malformed-input");

    const issueSpecial = await adapter.validate([file], { ranges: "1;2" });
    expect(issueSpecial).toHaveLength(1);

    expect(await adapter.validate([file], { ranges: "1, 2-3, 5" })).toEqual([]);
    expect(await adapter.validate([file], { ranges: "" })).toEqual([]);
  });

  test("worker split with out-of-bounds page range (e.g. page 999 on 2-page PDF)", async () => {
    const file = await createValidPdfFile(2);
    const action = () =>
      processPdfOperation({
        capabilityId: "pdf.split",
        jobId: "j-split-oob",
        inputs: [file],
        options: { ranges: "999", onePerRange: true },
        isCancelled: () => false,
        reportProgress: () => undefined,
      });

    await expect(action()).rejects.toThrow();
  });

  test("worker split with invalid inverted range (e.g. 5-2)", async () => {
    const file = await createValidPdfFile(5);
    const action = () =>
      processPdfOperation({
        capabilityId: "pdf.split",
        jobId: "j-split-inv",
        inputs: [file],
        options: { ranges: "5-2", onePerRange: true },
        isCancelled: () => false,
        reportProgress: () => undefined,
      });

    await expect(action()).rejects.toThrow();
  });

  test("worker split with 0 index (e.g. range 0)", async () => {
    const file = await createValidPdfFile(2);
    const action = () =>
      processPdfOperation({
        capabilityId: "pdf.split",
        jobId: "j-split-zero",
        inputs: [file],
        options: { ranges: "0", onePerRange: true },
        isCancelled: () => false,
        reportProgress: () => undefined,
      });

    await expect(action()).rejects.toThrow();
  });

  test("worker split with partially valid range (e.g. 1, 999)", async () => {
    const file = await createValidPdfFile(2);
    const result = await processPdfOperation({
      capabilityId: "pdf.split",
      jobId: "j-split-part-valid",
      inputs: [file],
      options: { ranges: "1, 999", onePerRange: false },
      isCancelled: () => false,
      reportProgress: () => undefined,
    });

    expect(result.mode).toBe("files");
    if (result.mode !== "files") throw new Error();
    const doc = await PDFDocument.load(await result.outputs[0]!.blob.arrayBuffer());
    expect(doc.getPageCount()).toBe(1);
  });
});

describe("PDF Core Audit: Organize Edge Cases (Duplicate, Reversed, Invalid Indices)", () => {
  test("adapter validation checks operations format", async () => {
    const adapter = createPdfOrganizeAdapter();
    const file = await createValidPdfFile(3);

    expect(await adapter.validate([file], { operations: "a,b,c" })).toEqual([
      expect.objectContaining({ code: "malformed-input", field: "operations" }),
    ]);

    expect(await adapter.validate([file], { operations: "-1,2" })).toEqual([
      expect.objectContaining({ code: "malformed-input", field: "operations" }),
    ]);

    expect(await adapter.validate([file], { operations: "none" })).toEqual([]);
    expect(await adapter.validate([file], { operations: "" })).toEqual([]);
    expect(await adapter.validate([file], { operations: "3,1,2" })).toEqual([]);
  });

  test("organize with reversed indices (e.g. 3,2,1 on a 3-page PDF)", async () => {
    const file = await createValidPdfFile(3);
    const result = await processPdfOperation({
      capabilityId: "pdf.organize",
      jobId: "j-org-rev",
      inputs: [file],
      options: { operations: "3,2,1" },
      isCancelled: () => false,
      reportProgress: () => undefined,
    });

    if (result.mode !== "files") throw new Error();
    const doc = await PDFDocument.load(await result.outputs[0]!.blob.arrayBuffer());
    expect(doc.getPageCount()).toBe(3);
  });

  test("organize with duplicate indices (e.g. 1,1,2 on a 2-page PDF)", async () => {
    const file = await createValidPdfFile(2);
    const result = await processPdfOperation({
      capabilityId: "pdf.organize",
      jobId: "j-org-dup",
      inputs: [file],
      options: { operations: "1,1,2" },
      isCancelled: () => false,
      reportProgress: () => undefined,
    });

    if (result.mode !== "files") throw new Error();
    const doc = await PDFDocument.load(await result.outputs[0]!.blob.arrayBuffer());
    expect(doc.getPageCount()).toBe(3);
  });

  test("organize with invalid out-of-bound indices (e.g. 999 on 2-page PDF)", async () => {
    const file = await createValidPdfFile(2);

    await expect(
      processPdfOperation({
        capabilityId: "pdf.organize",
        jobId: "j-org-all-invalid",
        inputs: [file],
        options: { operations: "999,1000" },
        isCancelled: () => false,
        reportProgress: () => undefined,
      }),
    ).rejects.toThrow(/no valid pages/i);

    await expect(
      processPdfOperation({
        capabilityId: "pdf.organize",
        jobId: "j-org-zero",
        inputs: [file],
        options: { operations: "0" },
        isCancelled: () => false,
        reportProgress: () => undefined,
      }),
    ).rejects.toThrow(/no valid pages/i);

    const result = await processPdfOperation({
      capabilityId: "pdf.organize",
      jobId: "j-org-mix",
      inputs: [file],
      options: { operations: "2, 999" },
      isCancelled: () => false,
      reportProgress: () => undefined,
    });

    if (result.mode !== "files") throw new Error();
    const doc = await PDFDocument.load(await result.outputs[0]!.blob.arrayBuffer());
    expect(doc.getPageCount()).toBe(1);
  });
});