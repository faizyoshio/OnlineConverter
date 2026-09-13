"use client";

import { EngineRouter } from "./router";

export function createActiveEngineRouter(): EngineRouter {
  const router = new EngineRouter();
  router.register("pdf.merge", async () => (await import("@/features/engines/pdf-merge")).createPdfMergeAdapter());
  router.register("pdf.split", async () => (await import("@/features/engines/pdf-split")).createPdfSplitAdapter());
  router.register("pdf.rotate", async () => (await import("@/features/engines/pdf-rotate")).createPdfRotateAdapter());
  router.register("pdf.crop", async () => (await import("@/features/engines/pdf-crop")).createPdfCropAdapter());
  router.register("pdf.resize", async () => (await import("@/features/engines/pdf-resize")).createPdfResizeAdapter());
  router.register("pdf.delete-pages", async () => (await import("@/features/engines/pdf-delete-pages")).createPdfDeletePagesAdapter());
  router.register("pdf.extract-pages", async () => (await import("@/features/engines/pdf-extract-pages")).createPdfExtractPagesAdapter());
  router.register("pdf.organize", async () => (await import("@/features/engines/pdf-organize")).createPdfOrganizeAdapter());
  router.register("pdf.page-numbers", async () => (await import("@/features/engines/pdf-page-numbers")).createPdfPageNumbersAdapter());
  router.register("pdf.watermark", async () => (await import("@/features/engines/pdf-watermark")).createPdfWatermarkAdapter());
  router.register("pdf.flatten", async () => (await import("@/features/engines/pdf-flatten")).createPdfFlattenAdapter());
  router.register("pdf.text-to-pdf", async () => (await import("@/features/engines/text-to-pdf")).createTextToPdfAdapter());
  router.register("pdf.image-to-pdf", async () => (await import("@/features/engines/image-to-pdf")).createImageToPdfAdapter());
  router.register("image.jpg-to-modern", async () => (await import("@/features/engines/image-jpg-to-png")).createImageJpgToPngAdapter());
  router.register("image.webp-to-jpg", async () => (await import("@/features/engines/image-webp-to-jpg")).createImageWebpToJpgAdapter());
  router.register("image.webp-to-png", async () => (await import("@/features/engines/image-webp-to-png")).createImageWebpToPngAdapter());
  router.register("image.jfif-to-png", async () => (await import("@/features/engines/image-jfif-to-png")).createImageJfifToPngAdapter());
  router.register("image.rotate", async () => (await import("@/features/engines/image-rotate")).createImageRotateAdapter());
  router.register("image.flip", async () => (await import("@/features/engines/image-flip")).createImageFlipAdapter());
  router.register("image.compress-jpeg", async () => (await import("@/features/engines/image-compress-jpg")).createImageCompressJpgAdapter());
  router.register("image.compress-webp", async () => (await import("@/features/engines/image-compress-webp")).createImageCompressWebpAdapter());
  router.register("image.resize", async () => (await import("@/features/engines/image-resize")).createImageResizeAdapter());
  router.register("image.crop", async () => (await import("@/features/engines/image-crop")).createImageCropAdapter());
  router.register("image.circle-crop", async () => (await import("@/features/engines/image-circle-crop")).createImageCircleCropAdapter());
  router.register("archive.zip-create", async () => (await import("@/features/engines/archive-zip-create")).createArchiveZipCreateAdapter());
  router.register("archive.zip-extract", async () => (await import("@/features/engines/zip-extract")).createZipExtractAdapter());
  router.register("utility.unit", async () => (await import("@/features/engines/utility-unit")).createUnitConverterAdapter());
  router.register("utility.time", async () => (await import("@/features/engines/utility-time")).createUtilityTimeAdapter());
  router.register("utility.barcode", async () => (await import("@/features/engines/utility-barcode")).createUtilityBarcodeAdapter());
  router.register("utility.password", async () => (await import("@/features/engines/utility-password")).createUtilityPasswordAdapter());
  return router;
}
