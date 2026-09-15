"use client";

import { EngineRouter } from "./router";

export function createActiveEngineRouter(): EngineRouter {
  const router = new EngineRouter();

  // --------------------------------------------------------------------------
  // PDF TOOLS (25)
  // --------------------------------------------------------------------------
  // OPTIMIZE PDF
  router.register("pdf.compress", async () => (await import("@/features/engines/pdf-compress")).createPdfCompressAdapter());

  // MERGE & SPLIT
  router.register("pdf.merge", async () => (await import("@/features/engines/pdf-merge")).createPdfMergeAdapter());
  router.register("pdf.merge-image", async () => (await import("@/features/engines/pdf-merge-images")).createPdfMergeImagesAdapter());
  router.register("pdf.split", async () => (await import("@/features/engines/pdf-split")).createPdfSplitAdapter());

  // VIEW & EDIT
  router.register("pdf.crop", async () => (await import("@/features/engines/pdf-crop")).createPdfCropAdapter());
  router.register("pdf.organize", async () => (await import("@/features/engines/pdf-organize")).createPdfOrganizeAdapter());
  router.register("pdf.rotate", async () => (await import("@/features/engines/pdf-rotate")).createPdfRotateAdapter());
  router.register("pdf.delete-pages", async () => (await import("@/features/engines/pdf-delete-pages")).createPdfDeletePagesAdapter());
  router.register("pdf.extract-pages", async () => (await import("@/features/engines/pdf-extract-pages")).createPdfExtractPagesAdapter());
  router.register("pdf.extract-images", async () => (await import("@/features/engines/pdf-extract-images")).createPdfExtractImagesAdapter());
  router.register("pdf.page-numbers", async () => (await import("@/features/engines/pdf-page-numbers")).createPdfPageNumbersAdapter());

  // CONVERT TO PDF
  router.register("pdf.image-to-pdf", async () => (await import("@/features/engines/image-to-pdf")).createImageToPdfAdapter());
  router.register("pdf.jpg-to-pdf", async () => (await import("@/features/engines/image-to-pdf")).createImageToPdfAdapter());
  router.register("pdf.word-to-pdf", async () => (await import("@/features/engines/pdf-word-to-pdf")).createWordToPdfAdapter());
  router.register("pdf.powerpoint-to-pdf", async () => (await import("@/features/engines/pdf-powerpoint-to-pdf")).createPowerpointToPdfAdapter());
  router.register("pdf.excel-to-pdf", async () => (await import("@/features/engines/pdf-excel-to-pdf")).createExcelToPdfAdapter());
  router.register("pdf.text-to-pdf", async () => (await import("@/features/engines/text-to-pdf")).createTextToPdfAdapter());

  // CONVERT FROM PDF
  router.register("pdf.to-image", async () => (await import("@/features/engines/pdf-to-image")).createPdfToImageAdapter());
  router.register("pdf.to-jpg", async () => (await import("@/features/engines/pdf-to-jpg")).createPdfToJpgAdapter());
  router.register("pdf.pdf-to-word", async () => (await import("@/features/engines/pdf-pdf-to-word")).createPdfToWordAdapter());
  router.register("pdf.pdf-to-powerpoint", async () => (await import("@/features/engines/pdf-pdf-to-powerpoint")).createPdfToPowerpointAdapter());
  router.register("pdf.pdf-to-excel", async () => (await import("@/features/engines/pdf-pdf-to-excel")).createPdfToExcelAdapter());
  router.register("pdf.to-text", async () => (await import("@/features/engines/pdf-to-text")).createPdfToTextAdapter());

  // PDF SECURITY
  router.register("pdf.unlock", async () => (await import("@/features/engines/pdf-unlock")).createPdfUnlockAdapter());
  router.register("pdf.protect", async () => (await import("@/features/engines/pdf-protect")).createPdfProtectAdapter());
  router.register("pdf.ocr", async () => (await import("@/features/engines/pdf-ocr")).createPdfOcrAdapter());

  // --------------------------------------------------------------------------
  // IMAGE TOOLS (13)
  // --------------------------------------------------------------------------
  // OPTIMIZE IMAGE
  router.register("image.compress", async () => (await import("@/features/engines/image/adapter")).createImageAdapter("image.compress"));
  router.register("image.compress-jpg", async () => (await import("@/features/engines/image/adapter")).createImageAdapter("image.compress-jpg"));
  router.register("image.compress-png", async () => (await import("@/features/engines/image/adapter")).createImageAdapter("image.compress-png"));
  router.register("image.compress-jpeg", async () => (await import("@/features/engines/image/adapter")).createImageAdapter("image.compress-jpeg"));
  router.register("image.compress-webp", async () => (await import("@/features/engines/image/adapter")).createImageAdapter("image.compress-webp"));
  router.register("image.compress-heic", async () => (await import("@/features/engines/image/adapter")).createImageAdapter("image.compress-heic"));
  router.register("image.compress-bmp", async () => (await import("@/features/engines/image/adapter")).createImageAdapter("image.compress-bmp"));

  // CONVERT IMAGE
  router.register("image.to-jpg", async () => (await import("@/features/engines/image/adapter")).createImageAdapter("image.to-jpg"));
  router.register("image.to-png", async () => (await import("@/features/engines/image/adapter")).createImageAdapter("image.to-png"));
  router.register("image.to-jpeg", async () => (await import("@/features/engines/image/adapter")).createImageAdapter("image.to-jpeg"));
  router.register("image.to-webp", async () => (await import("@/features/engines/image/adapter")).createImageAdapter("image.to-webp"));
  router.register("image.webp-to-jpg", async () => (await import("@/features/engines/image/adapter")).createImageAdapter("image.webp-to-jpg"));
  router.register("image.heic-to-jpg", async () => (await import("@/features/engines/image/adapter")).createImageAdapter("image.heic-to-jpg"));

  return router;
}
