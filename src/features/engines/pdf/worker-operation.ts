import { mergePdfs, rotatePdfPages, splitPdf, deletePdfPages, extractPdfPages, organizePdf, addPageNumbers, watermarkPdf, imageWatermarkPdf, textToPdf, imagesToPdf, cropPdfPages, resizePdfPagesToA4 } from "@/engines/pdf/operations";
import { createZip } from "@/engines/utility/operations";
import type { LocalWorkerResult } from "@/features/workers/protocol";
import type { LocalWorkerOperationContext } from "@/features/workers/local-runtime";
import { cropMarginsToPoints, parsePdfCropOptions, validatePdfResizeOptions } from "./options";

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

function fileExtension(input: File): string {
  const match = /\.([a-z0-9]+)$/i.exec(input.name);
  return match?.[1]?.toLowerCase() ?? "";
}

async function rasterForPdf(input: File): Promise<{ bytes: Uint8Array; format: "jpeg" | "png" }> {
  const extension = fileExtension(input);
  if (input.type === "image/png" || extension === "png") {
    return { bytes: new Uint8Array(await input.arrayBuffer()), format: "png" };
  }
  if (input.type === "image/jpeg" || extension === "jpg" || extension === "jpeg") {
    return { bytes: new Uint8Array(await input.arrayBuffer()), format: "jpeg" };
  }
  if (input.type !== "image/webp" && extension !== "webp") {
    throw new Error("Unsupported raster format");
  }

  const bitmap = await createImageBitmap(input);
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas rendering is unavailable");
    context.drawImage(bitmap, 0, 0);
    const png = await canvas.convertToBlob({ type: "image/png" });
    return { bytes: new Uint8Array(await png.arrayBuffer()), format: "png" };
  } finally {
    bitmap.close();
  }
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

    case "pdf.rotate": {
      reportProgress(0.1, "Loading PDF");
      const buffer = new Uint8Array(await inputs[0]!.arrayBuffer());
      const pdf = await (await import("pdf-lib")).PDFDocument.load(buffer);
      const pageCount = pdf.getPageCount();
      const rangeValue = String(options.pages ?? "all");
      const ranges = rangeValue === "all" ? [[0, pageCount - 1] as [number, number]] : parseRanges(rangeValue, pageCount);
      if (ranges.length === 0) throw new Error("No valid pages selected");
      const indices = ranges.flatMap(([start, end]) => Array.from({ length: end - start + 1 }, (_, index) => start + index));
      const degrees = Number(options.degrees);
      if (![90, 180, 270].includes(degrees)) throw new Error("Invalid rotation angle");
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };

      reportProgress(0.5, "Rotating pages");
      const rotated = await rotatePdfPages(buffer, indices, degrees);
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };

      reportProgress(0.9, "Finalizing");
      return {
        mode: "files",
        outputs: [{ blob: blobFromBytes(rotated, "application/pdf") }],
        metadata: { resultMode: "files", outputMimeTypes: ["application/pdf"], outputBytes: [rotated.length], pages: pageCount },
      };
    }

    case "pdf.crop": {
      reportProgress(0.1, "Loading PDF");
      const buffer = new Uint8Array(await inputs[0]!.arrayBuffer());
      const pdf = await (await import("pdf-lib")).PDFDocument.load(buffer);
      const pageCount = pdf.getPageCount();
      const cropOptions = parsePdfCropOptions(options);
      const ranges = cropOptions.applyToAll
        ? [[0, pageCount - 1] as [number, number]]
        : parseRanges(cropOptions.pages, pageCount);
      if (ranges.length === 0) throw new Error("No valid pages selected for cropping");
      const indices = Array.from(new Set(ranges.flatMap(([start, end]) =>
        Array.from({ length: end - start + 1 }, (_, index) => start + index))));
      const margins = cropMarginsToPoints(cropOptions.marginsMm);
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };
      reportProgress(0.5, "Cropping pages");
      const result = await cropPdfPages(buffer, indices, margins);
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };
      reportProgress(0.9, "Finalizing");
      return {
        mode: "files",
        outputs: [{ blob: blobFromBytes(result, "application/pdf") }],
        metadata: { resultMode: "files", outputMimeTypes: ["application/pdf"], outputBytes: [result.length], pages: pageCount },
      };
    }

    case "pdf.resize": {
      validatePdfResizeOptions(options);
      reportProgress(0.1, "Loading PDF");
      const buffer = new Uint8Array(await inputs[0]!.arrayBuffer());
      const pdf = await (await import("pdf-lib")).PDFDocument.load(buffer);
      const pageCount = pdf.getPageCount();
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };
      reportProgress(0.5, "Resizing pages");
      const result = await resizePdfPagesToA4(buffer);
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };
      reportProgress(0.9, "Finalizing");
      return {
        mode: "files",
        outputs: [{ blob: blobFromBytes(result, "application/pdf") }],
        metadata: { resultMode: "files", outputMimeTypes: ["application/pdf"], outputBytes: [result.length], pages: pageCount },
      };
    }

    case "pdf.delete-pages": {
      reportProgress(0.1, "Loading PDF");
      const buffer = new Uint8Array(await inputs[0]!.arrayBuffer());
      const pdf = await (await import("pdf-lib")).PDFDocument.load(buffer);
      const pageCount = pdf.getPageCount();
      const rangesString = String(options.pages ?? "");
      const ranges: [number, number][] = rangesString ? parseRanges(rangesString, pageCount) : [[0, pageCount - 1]];
      const indices = ranges.flatMap(([start, end]) => Array.from({ length: end - start + 1 }, (_, index) => start + index));
      if (indices.length >= pageCount) throw new Error("Cannot delete all pages");
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };

      reportProgress(0.5, "Deleting pages");
      const result = await deletePdfPages(buffer, indices);
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };

      reportProgress(0.9, "Finalizing");
      return {
        mode: "files",
        outputs: [{ blob: blobFromBytes(result, "application/pdf") }],
        metadata: { resultMode: "files", outputMimeTypes: ["application/pdf"], outputBytes: [result.length], pages: pageCount - indices.length },
      };
    }

    case "pdf.extract-pages": {
      reportProgress(0.1, "Loading PDF");
      const buffer = new Uint8Array(await inputs[0]!.arrayBuffer());
      const pdf = await (await import("pdf-lib")).PDFDocument.load(buffer);
      const pageCount = pdf.getPageCount();
      const rangesString = String(options.pages ?? "");
      const ranges: [number, number][] = rangesString ? parseRanges(rangesString, pageCount) : [[0, pageCount - 1]];
      const indices = ranges.flatMap(([start, end]) => Array.from({ length: end - start + 1 }, (_, index) => start + index));
      if (indices.length === 0) throw new Error("No valid pages selected");
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };

      reportProgress(0.5, "Extracting pages");
      const combined = options.combinedPdf !== false;
      if (!combined) {
        reportProgress(0.7, "Creating ZIP");
        const zipBytes = await createZip(
          await Promise.all(indices.map(async (pageIndex, outputIndex) => ({
            name: `extracted-${outputIndex + 1}-page-${pageIndex + 1}.pdf`,
            bytes: await extractPdfPages(buffer, [pageIndex]),
          }))),
          { deflateLevel: 6 },
        );
        return {
          mode: "files",
          outputs: [{ blob: blobFromBytes(zipBytes, "application/zip") }],
          metadata: { resultMode: "files", outputMimeTypes: ["application/zip"], outputBytes: [zipBytes.length], pages: indices.length },
        };
      }

      const result = await extractPdfPages(buffer, indices);
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };

      reportProgress(0.9, "Finalizing");
      return {
        mode: "files",
        outputs: [{ blob: blobFromBytes(result, "application/pdf") }],
        metadata: { resultMode: "files", outputMimeTypes: ["application/pdf"], outputBytes: [result.length], pages: indices.length },
      };
    }

    case "pdf.organize": {
      reportProgress(0.1, "Loading PDF");
      const buffer = new Uint8Array(await inputs[0]!.arrayBuffer());
      const pdf = await (await import("pdf-lib")).PDFDocument.load(buffer);
      const pageCount = pdf.getPageCount();
      const operations = String(options.operations ?? "none").trim();
      const ops = operations === "" || operations === "none"
        ? Array.from({ length: pageCount }, (_, index) => index)
        : operations.split(",").map((value) => parseInt(value.trim(), 10) - 1).filter((index) => index >= 0 && index < pageCount);
      if (ops.length === 0) throw new Error("No valid pages in new order");
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };

      reportProgress(0.5, "Reordering pages");
      const result = await organizePdf(buffer, ops);
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };

      reportProgress(0.9, "Finalizing");
      return {
        mode: "files",
        outputs: [{ blob: blobFromBytes(result, "application/pdf") }],
        metadata: { resultMode: "files", outputMimeTypes: ["application/pdf"], outputBytes: [result.length], pages: ops.length },
      };
    }

    case "pdf.page-numbers": {
      reportProgress(0.1, "Loading PDF");
      const buffer = new Uint8Array(await inputs[0]!.arrayBuffer());
      const pdf = await (await import("pdf-lib")).PDFDocument.load(buffer);
      const pageCount = pdf.getPageCount();
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };

      reportProgress(0.5, "Adding page numbers");
      const result = await addPageNumbers(buffer, { startNumber: Number(options.start), fontSize: 10 });
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };

      reportProgress(0.9, "Finalizing");
      return {
        mode: "files",
        outputs: [{ blob: blobFromBytes(result, "application/pdf") }],
        metadata: { resultMode: "files", outputMimeTypes: ["application/pdf"], outputBytes: [result.length], pages: pageCount },
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
      const output = onePerRange || split.length === 1 ? split[0]! : await mergePdfs(split);
      return {
        mode: "files",
        outputs: [{ blob: blobFromBytes(output, "application/pdf") }],
        metadata: { resultMode: "files", outputMimeTypes: ["application/pdf"], outputBytes: [output.length] },
      };
    }

    case "pdf.watermark": {
      reportProgress(0.1, "Loading PDF");
      const pdfInput = inputs.find((input) => input.type === "application/pdf" || fileExtension(input) === "pdf");
      if (!pdfInput) throw new Error("A PDF input is required");
      const buffer = new Uint8Array(await pdfInput.arrayBuffer());
      const pdf = await (await import("pdf-lib")).PDFDocument.load(buffer);
      const pageCount = pdf.getPageCount();
      const opacity = Number(options.opacity ?? 30) / 100;
      const rangeValue = String(options.pages ?? "all");
      const ranges = rangeValue === "all" ? [[0, pageCount - 1] as [number, number]] : parseRanges(rangeValue, pageCount);
      if (ranges.length === 0) throw new Error("No valid pages selected for watermark");
      const pageIndices = Array.from(new Set(ranges.flatMap(([start, end]) =>
        Array.from({ length: end - start + 1 }, (_, index) => start + index))));
      const watermarkText = String(options.watermarkText ?? "WATERMARK");
      const watermarkType = String(options.watermarkType ?? "text");
      if (watermarkType === "text" && !watermarkText.trim()) throw new Error("Watermark text is required");
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };

      reportProgress(0.5, "Applying watermark");
      let result: Uint8Array;
      if (watermarkType === "image") {
        const imageInput = inputs.find((input) => input !== pdfInput);
        if (!imageInput) throw new Error("A watermark image is required");
        result = await imageWatermarkPdf(buffer, await rasterForPdf(imageInput), { opacity, pageIndices });
      } else {
        result = await watermarkPdf(buffer, watermarkText, { opacity, fontSize: 48, pageIndices });
      }
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };
      reportProgress(0.9, "Finalizing");
      return {
        mode: "files",
        outputs: [{ blob: blobFromBytes(result, "application/pdf") }],
        metadata: { resultMode: "files", outputMimeTypes: ["application/pdf"], outputBytes: [result.length], pages: pageCount },
      };
    }

    case "pdf.text-to-pdf": {
      reportProgress(0.1, "Reading text file");
      const text = await inputs[0]!.text();
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };
      reportProgress(0.5, "Creating PDF");
      const orientation = options.orientation === "landscape" ? "landscape" : "portrait";
      const result = await textToPdf(text, {
        orientation,
        fontSize: Number(options.fontSizePt ?? 12),
        wrap: options.wrap !== false,
      });
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };
      const doc = await (await import("pdf-lib")).PDFDocument.load(result);
      reportProgress(0.9, "Finalizing");
      return {
        mode: "files",
        outputs: [{ blob: blobFromBytes(result, "application/pdf") }],
        metadata: { resultMode: "files", outputMimeTypes: ["application/pdf"], outputBytes: [result.length], pages: doc.getPageCount() },
      };
    }

    case "pdf.image-to-pdf": {
      reportProgress(0.1, "Loading images");
      const images = await Promise.all(inputs.map(rasterForPdf));
      if (images.length === 0) throw new Error("At least one image is required");
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };
      reportProgress(0.5, "Creating PDF");
      const fit = options.fit === "cover" || options.fit === "fill" ? options.fit : "contain";
      const result = await imagesToPdf(images, { fit, marginMm: Number(options.marginMm ?? 12) });
      if (isCancelled()) return { mode: "files", outputs: [], metadata: { resultMode: "files", outputMimeTypes: [], outputBytes: [] } };
      const doc = await (await import("pdf-lib")).PDFDocument.load(result);
      reportProgress(0.9, "Finalizing");
      return {
        mode: "files",
        outputs: [{ blob: blobFromBytes(result, "application/pdf") }],
        metadata: { resultMode: "files", outputMimeTypes: ["application/pdf"], outputBytes: [result.length], pages: doc.getPageCount() },
      };
    }

    case "pdf.heic-to-pdf": {
      throw new Error("HEIC decoding is not available in this browser worker");
    }

    default:
      throw new Error(`Unknown PDF capability: ${capabilityId}`);
  }
}
