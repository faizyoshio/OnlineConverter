import { mergePdfs, splitPdf } from "@/engines/pdf/operations";
import { createZip } from "@/engines/utility/operations";
import type { LocalWorkerResult } from "@/features/workers/protocol";
import type { LocalWorkerOperationContext } from "@/features/workers/local-runtime";

function parseRanges(rangeString: string, maxPage: number): [number, number][] {
  const ranges: [number, number][] = [];
  for (const part of rangeString.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const match = /^(\d+)(?:-(\d+))?$/.exec(trimmed);
    if (!match) continue;
    const start = parseInt(match[1]!, 10);
    const end = match[2] ? parseInt(match[2]!, 10) : start;
    if (start >= 1 && end >= start && start <= maxPage) {
      ranges.push([Math.max(0, start - 1), Math.min(maxPage - 1, end - 1)]);
    }
  }
  return ranges;
}

function blobFromBytes(bytes: Uint8Array, type: string): Blob {
  return new Blob([Uint8Array.from(bytes)], { type });
}

export async function processPdfOperation(context: LocalWorkerOperationContext): Promise<LocalWorkerResult> {
  const { capabilityId, inputs, options, isCancelled, reportProgress } = context;

  switch (capabilityId) {
    case "pdf.merge": {
      reportProgress(0.1, "Loading PDFs");
      const buffers = await Promise.all(inputs.map(async (file) => new Uint8Array(await file.arrayBuffer())));
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };

      reportProgress(0.3, "Merging PDFs");
      const merged = await mergePdfs(buffers);
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };

      const doc = await (await import("pdf-lib")).PDFDocument.load(merged);
      const pages = doc.getPageCount();
      reportProgress(0.9, "Finalizing");

      return {
        mode: "files",
        outputs: [{ blob: blobFromBytes(merged, "application/pdf") }],
        metadata: { resultMode: "files", outputMimeTypes: ["application/pdf"], outputBytes: [merged.length], pages },
      };
    }

    case "pdf.split": {
      reportProgress(0.1, "Loading PDF");
      const buffer = new Uint8Array(await inputs[0]!.arrayBuffer());
      const pdf = await (await import("pdf-lib")).PDFDocument.load(buffer);
      const maxPage = pdf.getPageCount();
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };

      reportProgress(0.3, "Splitting pages");
      const rangesString = options.ranges ? String(options.ranges) : "";
      const ranges: [number, number][] = rangesString ? parseRanges(rangesString, maxPage) : [[0, maxPage - 1]];
      const onePerRange = options.onePerRange !== false;
      const split = await splitPdf(buffer, ranges);
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };

      if (onePerRange && split.length > 1) {
        reportProgress(0.6, "Creating ZIP");
        const zipBytes = await createZip(
          split.map((bytes, i) => ({ name: `split-${i + 1}.pdf`, bytes })),
          { deflateLevel: 6 }
        );
        return {
          mode: "files",
          outputs: [{ blob: blobFromBytes(zipBytes, "application/zip") }],
          metadata: { resultMode: "files", outputMimeTypes: ["application/zip"], outputBytes: [zipBytes.length] },
        };
      }

      reportProgress(0.9, "Finalizing");
      return {
        mode: "files",
        outputs: split.map((bytes) => ({ blob: blobFromBytes(bytes, "application/pdf") })),
        metadata: { resultMode: "files", outputMimeTypes: ["application/pdf"], outputBytes: split.map((b) => b.length) },
      };
    }

    default:
      throw new Error(`Unknown PDF capability: ${capabilityId}`);
  }
}