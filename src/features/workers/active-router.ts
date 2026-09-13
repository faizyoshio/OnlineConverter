"use client";

import { EngineRouter } from "./router";

export function createActiveEngineRouter(): EngineRouter {
  const router = new EngineRouter();
  // ORGANIZE PDF
  router.register("pdf.merge", async () => (await import("@/features/engines/pdf-merge")).createPdfMergeAdapter());
  router.register("pdf.split", async () => (await import("@/features/engines/pdf-split")).createPdfSplitAdapter());
  router.register("pdf.delete-pages", async () => (await import("@/features/engines/pdf-delete-pages")).createPdfDeletePagesAdapter());
  router.register("pdf.extract-pages", async () => (await import("@/features/engines/pdf-extract-pages")).createPdfExtractPagesAdapter());
  router.register("pdf.organize", async () => (await import("@/features/engines/pdf-organize")).createPdfOrganizeAdapter());
  router.register("pdf.scan", async () => (await import("@/features/engines/pdf-scan")).createPdfScanAdapter());

  // OPTIMIZE PDF
  router.register("pdf.compress", async () => (await import("@/features/engines/pdf-compress")).createPdfCompressAdapter());
  router.register("pdf.repair", async () => (await import("@/features/engines/pdf-repair")).createPdfRepairAdapter());
  router.register("pdf.ocr", async () => (await import("@/features/engines/pdf-ocr")).createPdfOcrAdapter());

  // CONVERT TO PDF
  router.register("pdf.image-to-pdf", async () => (await import("@/features/engines/image-to-pdf")).createImageToPdfAdapter());
  router.register("pdf.word-to-pdf", async () => (await import("@/features/engines/pdf-word-to-pdf")).createWordToPdfAdapter());
  router.register("pdf.powerpoint-to-pdf", async () => (await import("@/features/engines/pdf-powerpoint-to-pdf")).createPowerpointToPdfAdapter());
  router.register("pdf.excel-to-pdf", async () => (await import("@/features/engines/pdf-excel-to-pdf")).createExcelToPdfAdapter());

  // CONVERT FROM PDF
  router.register("pdf.to-jpg", async () => (await import("@/features/engines/pdf-to-jpg")).createPdfToJpgAdapter());
  router.register("pdf.pdf-to-word", async () => (await import("@/features/engines/pdf-pdf-to-word")).createPdfToWordAdapter());
  router.register("pdf.pdf-to-powerpoint", async () => (await import("@/features/engines/pdf-pdf-to-powerpoint")).createPdfToPowerpointAdapter());
  router.register("pdf.pdf-to-excel", async () => (await import("@/features/engines/pdf-pdf-to-excel")).createPdfToExcelAdapter());

  return router;
}
